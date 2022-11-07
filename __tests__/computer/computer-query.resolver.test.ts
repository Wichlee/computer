/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
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

import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ComputerDTO } from '../../src/computer/graphql/computer-query.resolver.js';
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

const herstellerVorhanden = ['Alpha', 'Beta', 'Gamma'];

const teilHerstellerVorhanden = ['a', 't', 'g'];

const teilHerstellerNichtVorhanden = ['Xyz', 'abc'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    each(idVorhanden).test(
        'Computer zu vorhandener ID %s',
        async (id: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        computer(id: "${id}") {
                            hersteller
                            modell
                            seriennummer
                            farbe
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();
            expect(data.data).toBeDefined();

            const { computer } = data.data!;
            const result: ComputerDTO = computer;

            expect(result.hersteller).toMatch(/^\w/u);
            expect(result.version).toBeGreaterThan(-1);
            expect(result.id).toBeUndefined();
        },
    );

    test('Computer zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999999999999999999999';
        const body: GraphQLRequest = {
            query: `
                {
                    computer(id: "${id}") {
                        hersteller
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.computer).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(
            `Es wurde kein Computer mit der ID ${id} gefunden.`,
        );
        expect(path).toBeDefined();
        expect(path!![0]).toBe('computer');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    each(herstellerVorhanden).test(
        'Computer zu vorhandenem Hersteller %s',
        async (hersteller: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        computerList(hersteller: "${hersteller}") {
                            hersteller
                            modell
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();

            expect(data.data).toBeDefined();

            const { computerList } = data.data!;

            expect(computerList).not.toHaveLength(0);

            const computerArray: ComputerDTO[] = computerList;

            expect(computerArray).toHaveLength(1);

            const [computer] = computerArray;

            expect(computer!.hersteller).toBe(hersteller);
        },
    );

    each(teilHerstellerVorhanden).test(
        'Computer zu vorhandenem Teil-Hersteller %s',
        async (teilHersteller: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        computerList(hersteller: "${teilHersteller}") {
                            hersteller
                            modell
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();
            expect(data.data).toBeDefined();

            const { computerList } = data.data!;

            expect(computerList).not.toHaveLength(0);

            const computerArray: ComputerDTO[] = computerList;
            computerArray
                .map((computer) => computer.hersteller)
                .forEach((hersteller: string) =>
                    expect(hersteller.toLowerCase()).toEqual(
                        expect.stringContaining(teilHersteller),
                    ),
                );
        },
    );

    each(teilHerstellerNichtVorhanden).test(
        'Computer zu nicht vorhandenem Hersteller %s',
        async (teilHersteller: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        computerList(titel: "${teilHersteller}") {
                            hersteller
                            modell
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.data!.computerList).toBeNull();

            const { errors } = data;

            expect(errors).toHaveLength(1);

            const [error] = errors!;
            const { message, path, extensions } = error!;

            expect(message).toBe('Es wurden keine Computer gefunden.');
            expect(path).toBeDefined();
            expect(path!![0]).toBe('computerList');
            expect(extensions).toBeDefined();
            expect(extensions!.code).toBe('BAD_USER_INPUT');
        },
    );
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
