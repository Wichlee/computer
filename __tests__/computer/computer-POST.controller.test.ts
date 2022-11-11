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
import { ComputerDTO } from '../../src/computer/rest/computer-write.controller.js';
import { HttpStatus } from '@nestjs/common';
import { ID_PATTERN } from '../../src/computer/service/computer-validation.service.js';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuerComputer: ComputerDTO = {
    hersteller: 'Omega',
    modell: 'NOTEBOOK',
    herstelldatum: '2022-08-11',
    preis: 100.11,
    farbe: 'SCHWARZ',
    seriennummer: 'NB-15AD6T',
};
const neuerComputerInvalid: Record<string, unknown> = {
    hersteller: '§$%',
    modell: 'NoTizBuCh',
    herstelldatum: 'G1A8N7G',
    preis: -999,
    farbe: 'Lila Blassblau',
    seriennummer: 'keine Ahnung, 42',
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('POST /', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

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

    // (done?: DoneFn) => Promise<void | undefined | unknown> | void | undefined
    // close(callback?: (err?: Error) => void): this
    afterAll(async () => {
        await shutdownServer();
    });

    test('Neuer Computer', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/',
            neuerComputer,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ObjectID: Muster von HEX-Ziffern
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test('Neuer Computer mit ungueltigen Daten', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/',
            neuerComputerInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toEqual(
            expect.arrayContaining([
                'Ein Hersteller darf keine Sonderzeichen enthalten.',
                'Das Modell eines Computers muss DESKTOP_PC, GAMING_PC oder NOTEBOOK sein.',
                'Das Herstelldatum muss im Format yyyy-MM-dd sein.',
                'Der Preis darf nicht negativ sein.',
                'Die Farbe eines Computers muss ROT, SCHWARZ, SILBER oder WEISS sein.',
                'Die Seriennummer ist nicht korrekt.',
            ]),
        );
    });

    test('Neuer Computer, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/',
            neuerComputer,
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Neuer Computer, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/',
            neuerComputer,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test.todo('Abgelaufener Token');
});
