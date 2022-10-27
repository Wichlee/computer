/* eslint-disable max-lines */
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
import {
    type BuchNotExists,
    type CreateError,
    type TitelExists,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { type DeleteResult, Repository } from 'typeorm';
import { ComputerReadService } from './computer-read.service.js';
import { ComputerValidationService } from './computer-validation.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import RE2 from 're2';
import { Schlagwort } from '../entity/schlagwort.entity.js';
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

    // eslint-disable-next-line max-params
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
        const buchDb = await this.#repo.save(removeIsbnDash(buch)); // implizite Transaktion
        this.#logger.debug('create: buchDb=%o', buchDb);

        await this.#sendmail(buchDb);

        return buchDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
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

        const validateResult = await this.#validateUpdate(computer, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Computer)) {
            return validateResult;
        }

        const computerNeu = validateResult;
        const merged = this.#repo.merge(computerNeu, removeIsbnDash(buch));
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

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Der Computer zur gegebenen ID asynchron loeschen
            const { schlagwoerter } = buch;
            const schlagwoerterIds = schlagwoerter.map(
                (schlagwort) => schlagwort.id,
            );
            const deleteResultSchlagwoerter = await transactionalMgr.delete(
                Schlagwort,
                schlagwoerterIds,
            );
            this.#logger.debug(
                'delete: deleteResultSchlagwoerter=%o',
                deleteResultSchlagwoerter,
            );
            deleteResult = await transactionalMgr.delete(Buch, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate(computer: Computer): Promise<CreateError | undefined> {
        const validateResult = this.#validationService.validate(computer);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateCreate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const { hersteller } = computer;
        let computerList = await this.#readService.find({ hersteller: hersteller }); // eslint-disable-line object-shorthand
        if (computerList.length > 0) {
            return { type: 'HerstellerExists', hersteller };
        }

        const { isbn } = buch;
        buecher = await this.#readService.find({ isbn: isbn }); // eslint-disable-line object-shorthand
        if (buecher.length > 0) {
            return { type: 'IsbnExists', isbn };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #validateUpdate(
        buch: Buch,
        id: string,
        versionStr: string,
    ): Promise<Buch | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: buch=%o, version=%s',
            buch,
            version,
        );

        const validateResult = this.#validationService.validate(buch);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateUpdate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const resultTitel = await this.#checkTitelExists(buch);
        if (resultTitel !== undefined && resultTitel.id !== id) {
            return resultTitel;
        }

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !BuchWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #checkTitelExists(buch: Buch): Promise<TitelExists | undefined> {
        const { titel } = buch;

        const buecher = await this.#readService.find({ titel: titel }); // eslint-disable-line object-shorthand
        if (buecher.length > 0) {
            const [gefundenesBuch] = buecher;
            const { id } = gefundenesBuch!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            this.#logger.debug('#checkTitelExists: id=%s', id);
            return { type: 'TitelExists', titel, id: id! }; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        }

        this.#logger.debug('#checkTitelExists: ok');
        return undefined;
    }

    async #findByIdAndCheckVersion(
        id: string,
        version: number,
    ): Promise<Buch | BuchNotExists | VersionOutdated> {
        const buchDb = await this.#readService.findById(id);
        if (buchDb === undefined) {
            const result: BuchNotExists = { type: 'BuchNotExists', id };
            this.#logger.debug('#checkIdAndVersion: BuchNotExists=%o', result);
            return result;
        }

        // nullish coalescing
        const versionDb = buchDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
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

        return buchDb;
    }
}
/* eslint-enable max-lines */
