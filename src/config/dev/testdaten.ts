/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { type Computer } from '../../computer/entity/computer.entity.js';

// TypeORM kann keine SQL-Skripte ausfuehren

export const computerList: Computer[] = [
    // -------------------------------------------------------------------------
    // L e s e n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000001',
        version: 0,
        hersteller: 'Alpha',
        modell: 'DESKTOP_PC',
        herstelldatum: new Date('2022-02-01'),
        preis: 100.11,
        farbe: 'SCHWARZ',
        seriennummer: 'PC-49XJ9F',
        erzeugt: new Date('2022-02-01'),
        aktualisiert: new Date('2022-02-01'),
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        version: 0,
        hersteller: 'Beta',
        modell: 'NOTEBOOK',
        herstelldatum: new Date('2022-02-02'),
        preis: 200.22,
        farbe: 'SCHWARZ',
        seriennummer: 'NB-60HG2O',
        erzeugt: new Date('2022-02-02'),
        aktualisiert: new Date('2022-02-02'),
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        version: 0,
        hersteller: 'Gamma',
        modell: 'GAMING_PC',
        herstelldatum: new Date('2022-02-03'),
        preis: 300.33,
        farbe: 'SCHWARZ',
        seriennummer: 'GM-74ED7T',
        erzeugt: new Date('2022-02-03'),
        aktualisiert: new Date('2022-02-03'),
    },
    // -------------------------------------------------------------------------
    // A e n d e r n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000040',
        version: 0,
        hersteller: 'Delta',
        modell: 'NOTEBOOK',
        herstelldatum: new Date('2022-02-04'),
        preis: 400.44,
        farbe: 'SCHWARZ',
        seriennummer: 'NB-29PV4T',
        erzeugt: new Date('2022-02-04'),
        aktualisiert: new Date('2022-02-04'),
    },
    // -------------------------------------------------------------------------
    // L o e s c h e n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000050',
        version: 0,
        hersteller: 'Gamma',
        modell: 'DESKTOP_PC',
        herstelldatum: new Date('2022-02-05'),
        preis: 500.55,
        farbe: 'SCHWARZ',
        seriennummer: 'PC-31LB3U',
        erzeugt: new Date('2022-02-05'),
        aktualisiert: new Date('2022-02-05'),
    },
];
