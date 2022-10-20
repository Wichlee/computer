/* eslint-disable no-underscore-dangle */
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
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type BuecherModel } from '../../src/buch/rest/buch-get.controller.js';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const titelVorhanden = ['a', 't', 'g'];
const titelNichtVorhanden = ['xx', 'yy'];
const schlagwoerterVorhanden = ['javascript', 'typescript'];
const schlagwoerterNichtVorhanden = ['csharp', 'php'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Buecher', async () => {
        // given

        // when
        const response: AxiosResponse<BuecherModel> = await client.get('/');

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { buecher } = data._embedded;

        buecher
            .map((buch) => buch._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'u'));
            });
    });

    each(titelVorhanden).test(
        'Buecher mit einem Titel, der "%s" enthaelt',
        async (teilTitel: string) => {
            // given
            const params = { titel: teilTitel };

            // when
            const response: AxiosResponse<BuecherModel> = await client.get(
                '/',
                { params },
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            const { buecher } = data._embedded;

            // Jedes Buch hat einen Titel mit dem Teilstring 'a'
            buecher
                .map((buch) => buch.titel)
                .forEach((titel: string) =>
                    expect(titel.toLowerCase()).toEqual(
                        expect.stringContaining(teilTitel),
                    ),
                );
        },
    );

    each(titelNichtVorhanden).test(
        'Keine Buecher mit einem Titel, der "%s" enthaelt',
        async (teilTitel: string) => {
            // given
            const params = { titel: teilTitel };

            // when
            const response: AxiosResponse<string> = await client.get('/', {
                params,
            });

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );

    each(schlagwoerterVorhanden).test(
        'Mind. 1 Buch mit dem Schlagwort "%s"',
        async (schlagwort: string) => {
            // given
            const params = { [schlagwort]: 'true' };

            // when
            const response: AxiosResponse<BuecherModel> = await client.get(
                '/',
                { params },
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            expect(data).toBeDefined();

            const { buecher } = data._embedded;

            // Jedes Buch hat im Array der Schlagwoerter z.B. "javascript"
            buecher
                .map((buch) => buch.schlagwoerter)
                .forEach((schlagwoerter) =>
                    expect(schlagwoerter).toEqual(
                        expect.arrayContaining([schlagwort.toUpperCase()]),
                    ),
                );
        },
    );

    each(schlagwoerterNichtVorhanden).test(
        'Keine Buecher mit dem Schlagwort "%s"',
        async (schlagwort: string) => {
            // given
            const params = { [schlagwort]: 'true' };

            // when
            const response: AxiosResponse<string> = await client.get('/', {
                params,
            });

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );

    test('Keine Buecher zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });
});
/* eslint-enable no-underscore-dangle */
