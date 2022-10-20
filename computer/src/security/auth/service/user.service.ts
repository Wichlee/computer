/* eslint-disable @typescript-eslint/require-await */
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

import { Injectable } from '@nestjs/common';
import { type Role } from './role.js';
import { getLogger } from '../../../logger/logger.js';
import { users } from '../../../config/dev/users.js';

/**
 * Das Interface `User` beschreibt die Properties zu einer vorhandenen
 * Benutzerkennung.
 */
export interface User {
    userId: number;
    username: string;
    password: string;
    email: string;
    roles: Role[];
}

/**
 * Die Klasse `UserService` implementiert Funktionen, um Objekte vom Typ
 * {@linkcode User} zu suchen.
 */
@Injectable()
export class UserService {
    readonly #users = users;

    readonly #logger = getLogger(UserService.name);

    constructor() {
        this.#logger.info('users=%o', users);
    }

    /**
     * Ein {@linkcode User} wird anhand seines Benutzernamens gesucht.
     *
     * @param username Benutzername.
     * @return Ein Objekt vom Typ {@linkcode User}, falls es einen Benutzer
     *  mit dem angegebenen Benutzernamen gibt. Sonst `undefined`.
     */
    async findOne(username: string) {
        return this.#users.find((user: User) => user.username === username);
    }

    /**
     * Ein {@linkcode User} wird anhand seiner ID gesucht.
     *
     * @param id ID des gesuchten Benutzers.
     * @return Ein Objekt vom Typ {@linkcode User}, falls es einen Benutzer
     *  mit der angegebenen ID gibt. Sonst `undefined`.
     */
    async findById(id: number | undefined) {
        return this.#users.find((user: User) => user.userId === id);
    }
}
/* eslint-enable @typescript-eslint/require-await */
