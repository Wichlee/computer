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
 * Das Modul besteht aus der Funktion {@linkcode getLogger} für einen Logger auf
 * der Basis von Pino: https://getpino.io. Pino wird auch von Fastify genutzt.
 * Alternativen: Winston, log4js, Bunyan
 * @packageDocumentation
 */

import { type SonicBoom } from 'sonic-boom';
import { parentLogger } from '../config/logger.js';
import type pino from 'pino';

/**
 * Eine-Klasse, um ein Logger-Objekt von `Pino` zu erzeugen, so dass ein
 * _Kontext_ definiert wird, der bei jeder Log-Methode verwendet wird und i.a.
 * der Name einer eigenen Klasse ist.
 * @param context Der Kontext
 * @param kind i.a. `class`
 */
export const getLogger: (
    context: string,
    kind?: string,
) => pino.Logger<pino.ChildLoggerOptions & SonicBoom> = (
    context: string,
    kind = 'class',
) => {
    const bindings: Record<string, string> = {};
    // "indexed access" auf eine Property, deren Name als Wert im Argument "kind" uebergeben wird
    // eslint-disable-next-line security/detect-object-injection
    bindings[kind] = context;
    // https://getpino.io/#/docs/child-loggers
    return parentLogger.child(bindings);
};
