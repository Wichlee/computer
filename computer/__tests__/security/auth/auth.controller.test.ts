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

import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    loginPath,
    port,
    shutdownServer,
    startServer,
} from '../../testserver.js';
import { HttpStatus } from '@nestjs/common';
import dotenv from 'dotenv';
import each from 'jest-each';

dotenv.config();
const { env } = process;
const { USER_PASSWORD, USER_PASSWORD_FALSCH } = env;

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const username = 'admin';
const password = USER_PASSWORD;
const passwordFalsch = [USER_PASSWORD_FALSCH, USER_PASSWORD_FALSCH];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('REST-Schnittstelle /login', () => {
    let client: AxiosInstance;

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Login mit korrektem Passwort', async () => {
        // given
        const body = `username=${username}&password=${password}`;

        // when
        const response: AxiosResponse<{ token: string }> = await client.post(
            loginPath,
            body,
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.OK);

        const { token } = data;
        const tokenParts = token.split('.');

        expect(tokenParts).toHaveLength(3); // eslint-disable-line @typescript-eslint/no-magic-numbers
        expect(token).toMatch(/^[a-z\d]+\.[a-z\d]+\.[\w-]+$/iu);
    });

    each(passwordFalsch).test(
        'Login mit falschem Passwort',
        async (pwd: string) => {
            // given
            const body = `username=${username}&password=${pwd}`;

            // when
            const response: AxiosResponse<Record<string, any>> =
                await client.post(loginPath, body);

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.UNAUTHORIZED);
            expect(data.statusCode).toBe(HttpStatus.UNAUTHORIZED);
            expect(data.message).toMatch(/^Unauthorized$/iu);
        },
    );

    test('Login ohne Benutzerkennung', async () => {
        // given
        const body = '';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            loginPath,
            body,
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
        expect(data.statusCode).toBe(HttpStatus.UNAUTHORIZED);
        expect(data.message).toMatch(/^Unauthorized$/iu);
    });
});
