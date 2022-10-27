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
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { FindOptionsUtils, Repository, type SelectQueryBuilder } from 'typeorm';
import { Computer } from '../entity/computer.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/db.js';

/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #computerAlias = `${Computer.name
        .charAt(0)
        .toLowerCase()}${Computer.name.slice(1)}`;

    readonly #repo: Repository<Computer>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Computer) repo: Repository<Computer>) {
        this.#repo = repo;
    }

    /**
     * Einen Computer mit der ID suchen.
     * @param id ID des gesuchten Computers
     * @returns QueryBuilder
     */
    buildId(id: string) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#computerAlias);
        // Option { eager: true } in der Entity-Klasse wird nur bei find-Methoden des Repositories beruecksichtigt
        // https://github.com/typeorm/typeorm/issues/8292#issuecomment-1036991980
        // https://github.com/typeorm/typeorm/issues/7142
        FindOptionsUtils.joinEagerRelations(
            queryBuilder,
            queryBuilder.alias,
            this.#repo.metadata,
        );

        queryBuilder.where(`${this.#computerAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Computer asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    // eslint-disable-next-line max-lines-per-function
    build(suchkriterien: Record<string, any>) {
        this.#logger.debug('build: suchkriterien=%o', suchkriterien);

        let queryBuilder = this.#repo.createQueryBuilder(this.#computerAlias);
        // Option { eager: true } in der Entity-Klasse wird nur bei find-Methoden des Repositories beruecksichtigt
        // https://github.com/typeorm/typeorm/issues/8292#issuecomment-1036991980
        // https://github.com/typeorm/typeorm/issues/7142
        FindOptionsUtils.joinEagerRelations(
            queryBuilder,
            queryBuilder.alias,
            this.#repo.metadata,
        );

        // z.B. { hersteller: 'a', rating: 5, javascript: true }
        // Rest Properties fuer anfaengliche WHERE-Klausel
        // type-coverage:ignore-next-line
        const { hersteller, seriennummer, javascript, typescript, ...props } = suchkriterien;

        let useWhere = true;

        // Hersteller in der Query: Teilstring des Herstellers und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (hersteller !== undefined && typeof hersteller === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#computerAlias}.hersteller ${ilike} :hersteller`,
                { hersteller: `%${hersteller}%` },
            );
            useWhere = false;
        }

        // type-coverage:ignore-next-line
        if (seriennummer !== undefined && typeof seriennummer === 'string') {
            // "-" aus Seriennummer entfernen, da diese nicht abgespeichert sind
            const seriennummerOhne = seriennummer.replaceAll('-', '');
            const param = {
                seriennummer: seriennummerOhne,
            };
            queryBuilder = useWhere
                ? queryBuilder.where(`${this.#computerAlias}.seriennummer = :seriennummer`, param)
                : queryBuilder.andWhere(
                      `${this.#computerAlias}.seriennummer = :seriennummer`,
                      param,
                  );
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = props[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#computerAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#computerAlias}.${key} = :${key}`,
                      param,
                  );
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
