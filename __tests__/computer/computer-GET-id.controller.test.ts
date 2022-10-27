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

// Tests mit
//  * jest      https://jestjs.io
//  * Mocha     https://mochajs.org
//  * node:test ab Node 18 https://nodejs.org/download/rc/v18.0.0-rc.1/docs/api/test.html

// https://github.com/testjavascript/nodejs-integration-tests-best-practices
// axios: https://github.com/axios/axios

// Alternativen zu axios:
// https://github.com/request/request/issues/3143
// https://blog.bitsrc.io/comparing-http-request-libraries-for-2019-7bedb1089c83
//    got         https://github.com/sindresorhus/got
//    node-fetch  https://github.com/node-fetch/node-fetch
//                https://fetch.spec.whatwg.org
//                https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
//    needle      https://github.com/tomas/needle
//    ky          https://github.com/sindresorhus/ky

import { afterAll, beforeAll, describe } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ComputerModel } from '../../src/computer/rest/computer-get.controller.js';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
];
const idNichtVorhanden = [
    '88888888-8888-8888-8888-888888888888',
    '99999999-9999-9999-9999-999999999999',
];
const idVorhandenETag = [
    ['00000000-0000-0000-0000-000000000001', '"0"'],
    ['00000000-0000-0000-0000-000000000002', '"0"'],
];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /:id', () => {
    let client: AxiosInstance;

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    each(idVorhanden).test('Buch zu vorhandener ID %s', async (id: string) => {
        // given - arrange
        const url = `/${id}`;

        // when - act
        const response: AxiosResponse<ComputerModel> = await client.get(url);

        // then - assert
        const { status, headers, data } = response; //destructuring

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); //iu = caseinsensitive unicode

        // eslint-disable-next-line no-underscore-dangle
        const selfLink = data._links.self.href;

        // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
        expect(selfLink).toMatch(new RegExp(`${url}$`, 'u'));
    });

    each(idNichtVorhanden).test(
        'Kein Buch zu nicht-vorhandener ID %s',
        async (id: string) => {
            // given
            const url = `/${id}`;

            // when
            const response: AxiosResponse<string> = await client.get(url);

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );

    each(idVorhandenETag).test(
        'Buch zu vorhandener ID %s mit ETag %s',
        async (id: string, etag: string) => {
            // given
            const url = `/${id}`;

            // when
            const response: AxiosResponse<string> = await client.get(url, {
                headers: { 'If-None-Match': etag }, // eslint-disable-line @typescript-eslint/naming-convention
            });

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_MODIFIED);
            expect(data).toBe('');
        },
    );
});
