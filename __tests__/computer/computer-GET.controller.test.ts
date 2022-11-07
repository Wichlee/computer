/* eslint-disable no-underscore-dangle */
/*
 * Copyright (C) 2022 - present Ioannis Theodosiadis, Hochschule Karlsruhe
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
import { type ComputerListModel } from '../../src/computer/rest/computer-get.controller.js';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const herstellerVorhanden = ['k', 'g', 't'];
const herstellerNichtVorhanden = ['xx', 'yy'];

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

    test('Alle computers', async () => {
        // given

        // when
        const response: AxiosResponse<ComputerListModel> = await client.get(
            '/',
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { computerList } = data._embedded;

        computerList
            .map((computer) => computer._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'u'));
            });
    });

    each(herstellerVorhanden).test(
        'Computer mit Herstellern, die "%s" enthaelt',
        async (teilHersteller: string) => {
            // given
            const params = { hersteller: teilHersteller };

            // when
            const response: AxiosResponse<ComputerListModel> = await client.get(
                '/',
                { params },
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            const { computerList } = data._embedded;

            computerList
                .map((computer) => computer.hersteller)
                .forEach((hersteller: string) =>
                    expect(hersteller.toLowerCase()).toEqual(
                        expect.stringContaining(teilHersteller),
                    ),
                );
        },
    );

    each(herstellerNichtVorhanden).test(
        'Keine computers mit einem Titel, der "%s" enthaelt',
        async (teilHersteller: string) => {
            // given
            const params = { hersteller: teilHersteller };

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

    test('Keine Computer zu einer nicht-vorhandenen Property', async () => {
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
