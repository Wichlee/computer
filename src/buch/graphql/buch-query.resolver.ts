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
import { type Buch } from '../entity/buch.entity.js';
import { BuchReadService } from '../service/buch-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';
import { getLogger } from '../../logger/logger.js';

export type BuchDTO = Omit<
    Buch,
    'aktualisiert' | 'erzeugt' | 'schlagwoerter'
> & { schlagwoerter: string[] };
export interface IdInput {
    id: string;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class BuchQueryResolver {
    readonly #service: BuchReadService;

    readonly #logger = getLogger(BuchQueryResolver.name);

    constructor(service: BuchReadService) {
        this.#service = service;
    }

    @Query('buch')
    async findById(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('findById: id=%s', idStr);

        const buch = await this.#service.findById(idStr);
        if (buch === undefined) {
            // UserInputError liefert Statuscode 200
            // Weitere Error-Klasse in apollo-server-errors:
            // SyntaxError, ValidationError, AuthenticationError, ForbiddenError,
            // PersistedQuery, PersistedQuery
            // https://www.apollographql.com/blog/graphql/error-handling/full-stack-error-handling-with-graphql-apollo
            throw new UserInputError(
                `Es wurde kein Buch mit der ID ${idStr} gefunden.`,
            );
        }
        const buchDTO = this.#toBuchDTO(buch);
        this.#logger.debug('findById: buchDTO=%o', buchDTO);
        return buchDTO;
    }

    @Query('buecher')
    async find(@Args() titel: { titel: string } | undefined) {
        const titelStr = titel?.titel;
        this.#logger.debug('find: titel=%s', titelStr);
        const suchkriterium = titelStr === undefined ? {} : { titel: titelStr };
        const buecher = await this.#service.find(suchkriterium);
        if (buecher.length === 0) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError('Es wurden keine Buecher gefunden.');
        }

        const buecherDTO = buecher.map((buch) => this.#toBuchDTO(buch));
        this.#logger.debug('find: buecherDTO=%o', buecherDTO);
        return buecherDTO;
    }

    #toBuchDTO(buch: Buch) {
        const schlagwoerter = buch.schlagwoerter.map(
            (schlagwort) => schlagwort.schlagwort!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        );
        const buchDTO: BuchDTO = {
            id: buch.id,
            version: buch.version,
            titel: buch.titel,
            rating: buch.rating,
            art: buch.art,
            verlag: buch.verlag,
            preis: buch.preis,
            rabatt: buch.rabatt,
            lieferbar: buch.lieferbar,
            datum: buch.datum,
            isbn: buch.isbn,
            homepage: buch.homepage,
            schlagwoerter,
        };
        return buchDTO;
    }
}
