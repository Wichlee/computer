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
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { type Computer } from '../entity/computer.entity.js';
import { ComputerWriteService } from '../service/computer-write.service.js';
import { type IdInput } from './buch-query.resolver.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { Roles } from '../../security/auth/roles/roles.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { UserInputError } from 'apollo-server-express';
import { getLogger } from '../../logger/logger.js';

type ComputerCreateDTO = Omit<
    Computer,
    'aktualisiert' | 'erzeugt' | 'id' | 'version'
>;
type ComputerUpdateDTO = Omit<Computer, 'aktualisiert' | 'erzeugt'>;

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class ComputerMutationResolver {
    readonly #service: ComputerWriteService;

    readonly #logger = getLogger(ComputerMutationResolver.name);

    constructor(service: ComputerWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async create(@Args('input') computerDTO: ComputerCreateDTO) {
        this.#logger.debug('create: computerDTO=%o', computerDTO);

        const result = await this.#service.create(this.#dtoToComputer(comuterDTO));
        this.#logger.debug('createComputer: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError(
                this.#errorMsgCreateBuch(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async update(@Args('input') computer: ComputerUpdateDTO) {
        this.#logger.debug('update: computer=%o', computer);
        const versionStr = `"${computer.version?.toString()}"`;

        const result = await this.#service.update(
            computer.id,
            computer as Computer,
            versionStr,
        );
        if (typeof result === 'object') {
            throw new UserInputError(this.#errorMsgUpdateComputer(result));
        }
        this.#logger.debug('updateComputer: result=%d', result);
        return result;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteComputer: result=%s', result);
        return result;
    }

    #dtoToBuch(buchDTO: BuchCreateDTO): Buch {
        const buch: Buch = {
            id: undefined,
            version: undefined,
            titel: buchDTO.titel,
            rating: buchDTO.rating,
            art: buchDTO.art,
            verlag: buchDTO.verlag,
            preis: buchDTO.preis,
            rabatt: buchDTO.rabatt,
            lieferbar: buchDTO.lieferbar,
            datum: buchDTO.datum,
            isbn: buchDTO.isbn,
            homepage: buchDTO.homepage,
            schlagwoerter: [],
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        buchDTO.schlagwoerter.forEach((s) => {
            const schlagwort: Schlagwort = {
                id: undefined,
                schlagwort: s,
                buch,
            };
            buch.schlagwoerter.push(schlagwort);
        });

        return buch;
    }

    #errorMsgCreateBuch(err: CreateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'TitelExists':
                return `Der Titel "${err.titel}" existiert bereits`;
            case 'IsbnExists':
                return `Die ISBN ${err.isbn} existiert bereits`;
            default:
                return 'Unbekannter Fehler';
        }
    }

    #errorMsgUpdateBuch(err: UpdateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'TitelExists':
                return `Der Titel "${err.titel}" existiert bereits`;
            case 'BuchNotExists':
                return `Es gibt kein Buch mit der ID ${err.id}`;
            case 'VersionInvalid':
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            case 'VersionOutdated':
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            default:
                return 'Unbekannter Fehler';
        }
    }
}
