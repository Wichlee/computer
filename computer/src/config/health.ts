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

/**
 * Das Modul enthält die Konfigurations-Information für Health.
 * @packageDocumentation
 */

import { env } from './env.js';

interface HealthConfig {
    readonly prettyPrint: boolean;
}

const { healthConfigEnv } = env;
const { prettyPrint } = healthConfigEnv;

/**
 * Das Konfigurationsobjekt für Health.
 */
export const healthConfig: HealthConfig = {
    prettyPrint:
        prettyPrint !== undefined && prettyPrint.toLowerCase() === 'true',
};

console.info('healthConfig: %o', healthConfig);
