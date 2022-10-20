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

import { type User } from '../../security/auth/service/user.service.js';
import { env } from '../env.js';

const { password } = env.authConfigEnv;

/**
 * Ein JSON-Array der Benutzerdaten mit den vorhandenen Rollen.
 * Nicht Set, weil es dafür keine Suchfunktion gibt.
 */
export const users: User[] = [
    {
        userId: 1,
        username: 'admin',
        password,
        email: 'admin@acme.com',
        roles: ['admin', 'mitarbeiter'],
    },
    {
        userId: 2,
        username: 'adriana.alpha',
        password,
        email: 'adriana.alpha@acme.com',
        roles: ['admin', 'mitarbeiter'],
    },
    {
        userId: 3,
        username: 'alfred.alpha',
        password,
        email: 'alfred.alpha@acme.com',
        roles: ['mitarbeiter'],
    },
    {
        userId: 4,
        username: 'antonia.alpha',
        password,
        email: 'antonia.alpha@acme.com',
        roles: ['mitarbeiter'],
    },
    {
        userId: 5,
        username: 'dirk.delta',
        password,
        email: 'dirk.delta@acme.com',
        roles: ['kunde'],
    },
    {
        userId: 6,
        username: 'emilia.epsilon',
        password,
        email: 'emilia.epsilon@acme.com',
        roles: ['kunde'],
    },
];
