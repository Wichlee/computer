/*
 * Copyright (C) 2019 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { type GenericJsonSchema } from './GenericJsonSchema.js';

export const jsonSchema: GenericJsonSchema = {
    // naechstes Release: 2021-02-01
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://acme.com/computer.json#',
    title: 'Computer',
    description: 'Eigenschaften eines Computers: Typen und Constraints',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            pattern:
                '^[\\dA-Fa-f]{8}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{12}$',
        },
        version: {
            type: 'number',
            minimum: 0,
        },
        hersteller: {
            type: 'string',
            pattern: '^\\w.*',
        },
        modell: {
            type: 'string',
            enum: ['Desktop-PC', 'Gaming-PC', ''],
        },
        herstelldatum: { type: 'string', format: 'date' },
        preis: {
            type: 'number',
            minimum: 0,
        },
        farbe: {
            type: 'string',
            enum: ['rot', 'schwarz', ''],
        },
        seriennummer: { type: 'string', format: 'Seriennummer' },
        erzeugt: { type: ['string', 'null'] },
        aktualisiert: { type: ['string', 'null'] },
    },
    required: ['hersteller', 'preis', 'seriennummer'],
    additionalProperties: false,
    errorMessage: {
        properties: {
            version: 'Die Versionsnummer muss mindestens 0 sein.',
            hersteller:
                'Ein Hersteller muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
            modell: 'Das Modell eines Computers muss Desktop-PC oder Gaming-PC sein.',
            herstelldatum: 'Das Datum muss im Format yyyy-MM-dd sein.',
            preis: 'Der Preis darf nicht negativ sein.',
            farbe: 'Die Farbe eines Computers muss rot oder schwarz sein.',
            seriennummer: 'Die Seriennummer ist nicht korrekt.',
        },
    },
};
