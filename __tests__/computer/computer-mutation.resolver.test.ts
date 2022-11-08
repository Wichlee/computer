/* eslint-disable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
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
import { HttpStatus } from '@nestjs/common';
import { ID_PATTERN } from '../../src/computer/service/computer-validation.service.js';
import each from 'jest-each';
import { loginGraphQL } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idsLoeschen = ['00000000-0000-0000-0000-000000000003'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Mutations', () => {
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

    // -------------------------------------------------------------------------
    test('Neuer Computer', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLRequest = {
            query: `
                mutation {
                    create(
                        input: {
                            hersteller: "Omikron",
                            modell: DESKTOP_PC,
                            herstelldatum: new Date('2022-06-08'),
                            preis: 145.15,
                            farbe: SCHWARZ,
                            seriennummer: "PC-78KE2U",
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeDefined();

        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ObjectID
        expect(create).toBeDefined();
        expect(ID_PATTERN.test(create as string)).toBe(true);
    });

    // -------------------------------------------------------------------------
    test('Neuen Computer nur als "admin"/"mitarbeiter"', async () => {
        // given
        const token = await loginGraphQL(client, 'dirk.delta', 'p');
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLRequest = {
            query: `
                mutation {
                    create(
                        input: {
                            hersteller: "Omikron",
                            modell: DESKTOP_PC,
                            herstelldatum: new Date('2022-06-08'),
                            preis: 145.15,
                            farbe: SCHWARZ,
                            seriennummer: "PC-78KE2U"
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, extensions } = error!;

        expect(message).toBe('Forbidden resource');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('FORBIDDEN');
    });

    // -------------------------------------------------------------------------
    test('Computer aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLRequest = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "00000000-0000-0000-0000-000000000002",
                            hersteller: "Beta",
                            modell: DESKTOP,
                            herstelldatum: new Date('2022-03-12'),
                            preis: 250.00,
                            farbe: SCHWARZ,
                            seriennummer: "PC-60HG2O"
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const { update } = data.data!;

        // Der Wert der Mutation ist die neue Versionsnummer
        expect(update).toBe(1);
    });

    // -------------------------------------------------------------------------
    // eslint-disable-next-line max-lines-per-function
    test('Computer mit ungueltigen Werten aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLRequest = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "00000000-0000-0000-0000-000000000004",
                            version: 1,
                            hersteller: "§$%",
                            modell: NoTizBuCh,
                            herstelldatum: "G1A8N7G",
                            preis: -89,
                            farbe: Lila Blassblau,
                            seriennummer: "keine Ahnung, 42",
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toEqual(
            expect.stringContaining(
                'Ein Hersteller darf keine Sonderzeichen enthalten.',
            ),
        );
        expect(message).toEqual(
            expect.stringContaining(
                'Das Herstelldatum muss im Format yyyy-MM-dd sein.',
            ),
        );
        expect(message).toEqual(
            expect.stringContaining('Der Preis darf nicht negativ sein.'),
        );
        expect(message).toEqual(
            expect.stringContaining(
                'Das Datum muss im Format yyyy-MM-dd sein.',
            ),
        );
        expect(message).toEqual(
            expect.stringContaining('Die Seriennummer ist nicht korrekt.'),
        );
        expect(message).toEqual(
            expect.stringContaining('Die Homepage ist nicht korrekt.'),
        );
        expect(path).toBeDefined();
        expect(path![0]).toBe('update');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    // -------------------------------------------------------------------------
    test('Nicht-vorhandenen Computer aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const id = '99999999-9999-9999-9999-999999999999';
        const body: GraphQLRequest = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "${id}",
                            version: 0,
                            hersteller: "§$%",
                            modell: NoTizBuCh,
                            herstelldatum: "G1A8N7G",
                            preis: -89,
                            farbe: Lila Blassblau,
                            seriennummer: "keine Ahnung, 42",
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(
            `Es gibt keinen Computer mit der ID ${id.toLowerCase()}`,
        );
        expect(path).toBeDefined();
        expect(path!![0]).toBe('update');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    // -------------------------------------------------------------------------
    each(idsLoeschen).test('Computer loeschen %s', async (id: string) => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLRequest = {
            query: `
                mutation {
                    delete(id: "${id}")
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const deleteMutation = data.data!.delete;

        // Der Wert der Mutation ist true (falls geloescht wurde) oder false
        expect(deleteMutation).toBe(true);
    });
});
/* eslint-enable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
