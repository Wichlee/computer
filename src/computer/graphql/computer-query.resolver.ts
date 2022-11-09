/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type Computer } from '../entity/computer.entity.js';
import { ComputerReadService } from '../service/computer-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';
import { getLogger } from '../../logger/logger.js';

export type ComputerDTO = Omit<Computer, 'aktualisiert' | 'erzeugt'>;
export interface IdInput {
    id: string;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class ComputerQueryResolver {
    readonly #service: ComputerReadService;

    readonly #logger = getLogger(ComputerQueryResolver.name);

    constructor(service: ComputerReadService) {
        this.#service = service;
    }

    @Query('computer')
    async findById(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('findById: id=%s', idStr);

        const computer = await this.#service.findById(idStr);
        if (computer === undefined) {
            // UserInputError liefert Statuscode 200
            // Weitere Error-Klasse in apollo-server-errors:
            // SyntaxError, ValidationError, AuthenticationError, ForbiddenError,
            // PersistedQuery, PersistedQuery
            // https://www.apollographql.com/blog/graphql/error-handling/full-stack-error-handling-with-graphql-apollo
            throw new UserInputError(
                `Es wurde kein Computer mit der ID ${idStr} gefunden.`,
            );
        }
        const computerDTO = this.#toComputerDTO(computer);
        this.#logger.debug('findById: computerDTO=%o', computerDTO);
        return computerDTO;
    }

    @Query('computerList')
    async find(@Args() hersteller: { hersteller: string } | undefined) {
        const herstellerStr = hersteller?.hersteller;
        this.#logger.debug('find: hersteller=%s', herstellerStr);
        const suchkriterium =
            herstellerStr === undefined ? {} : { hersteller: herstellerStr };
        const computerList = await this.#service.find(suchkriterium);
        if (computerList.length === 0) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError('Es wurden keine Computer gefunden.');
        }

        const computerListDTO = computerList.map((computer) =>
            this.#toComputerDTO(computer),
        );
        this.#logger.debug('find: comuterListDTO=%o', computerListDTO);
        return computerListDTO;
    }

    #toComputerDTO(computer: Computer) {
        const computerDTO: ComputerDTO = {
            id: computer.id,
            version: computer.version,
            hersteller: computer.hersteller,
            modell: computer.modell,
            herstelldatum: computer.herstelldatum,
            preis: computer.preis,
            farbe: computer.farbe,
            seriennummer: computer.seriennummer,
        };
        return computerDTO;
    }
}
