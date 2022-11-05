/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Klasse {@linkcode ComputerWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Computer } from '../entity/computer.entity.js';
// eslint-disable-next-line sort-imports
import {
    type ComputerNotExists,
    type CreateError,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { type Repository } from 'typeorm';
// eslint-disable-next-line sort-imports
import { ComputerReadService } from './computer-read.service.js';
import { ComputerValidationService } from './computer-validation.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import RE2 from 're2';
import { getLogger } from '../../logger/logger.js';
import { v4 as uuid } from 'uuid';

/**
 * Die Klasse `ComputerWriteService` implementiert den Anwendungskern für das
 * Schreiben von Computer und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class ComputerWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Computer>;

    readonly #readService: ComputerReadService;

    readonly #validationService: ComputerValidationService;

    readonly #logger = getLogger(ComputerWriteService.name);

    constructor(
        @InjectRepository(Computer) repo: Repository<Computer>,
        readService: ComputerReadService,
        validationService: ComputerValidationService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#validationService = validationService;
    }

    /**
     * Ein neuer Computer soll angelegt werden.
     * @param computer Der neu abzulegende Computer
     * @returns Die ID des neu angelegten Computers oder im Fehlerfall
     * [CreateError](../types/computer_service_errors.CreateError.html)
     */
    async create(computer: Computer): Promise<CreateError | string> {
        this.#logger.debug('create: computer=%o', computer);
        const validateResult = await this.#validateCreate(computer);
        if (validateResult !== undefined) {
            return validateResult;
        }

        computer.id = uuid(); // eslint-disable-line require-atomic-updates

        // implizite Transaktion
        const computerDb = await this.#repo.save(computer);
        this.#logger.debug('create: computerDb=%o', computerDb);

        return computerDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein vorhandener Computer soll aktualisiert werden.
     * @param computer Der zu aktualisierende Computer
     * @param id ID des zu aktualisierenden Computers
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/computer_service_errors.UpdateError.html)
     */
    async update(
        id: string | undefined,
        computer: Computer,
        version: string,
    ): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%s, computer=%o, version=%s',
            id,
            computer,
            version,
        );
        if (id === undefined || !this.#validationService.validateId(id)) {
            this.#logger.debug('update: Keine gueltige ID');
            return { type: 'ComputerNotExists', id };
        }

        const validateResult = await this.#validateUpdate(
            computer,
            id,
            version,
        );
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Computer)) {
            return validateResult;
        }

        const computerNeu = validateResult;
        const merged = this.#repo.merge(computerNeu);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein Computer wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Computers
     * @returns true, falls der Computer vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: string) {
        this.#logger.debug('delete: id=%s', id);
        if (!this.#validationService.validateId(id)) {
            this.#logger.debug('delete: Keine gueltige ID');
            return false;
        }

        const computer = await this.#readService.findById(id);
        if (computer === undefined) {
            return false;
        }
    }

    async #validateCreate(
        computer: Computer,
    ): Promise<CreateError | undefined> {
        const validateResult = this.#validationService.validate(computer);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateCreate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const { seriennummer } = computer;
        const computerList = await this.#readService.find({
            // eslint-disable-next-line object-shorthand
            seriennummer: seriennummer,
        });
        if (computerList.length > 0) {
            return { type: 'SeriennummerExists', seriennummer };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #validateUpdate(
        computer: Computer,
        id: string,
        versionStr: string,
    ): Promise<Computer | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: computer=%o, version=%s',
            computer,
            version,
        );

        const validateResult = this.#validationService.validate(computer);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateUpdate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !ComputerWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(
        id: string,
        version: number,
    ): Promise<Computer | ComputerNotExists | VersionOutdated> {
        const computerDb = await this.#readService.findById(id);
        if (computerDb === undefined) {
            const result: ComputerNotExists = { type: 'ComputerNotExists', id };
            this.#logger.debug(
                '#checkIdAndVersion: ComputerNotExists=%o',
                result,
            );
            return result;
        }

        // nullish coalescing
        const versionDb = computerDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return computerDb;
    }
}
