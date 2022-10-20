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

/**
 * Das Modul enthält die Konfiguration für den Mail-Client mit _nodemailer_.
 * @packageDocumentation
 */

import { type Options } from 'nodemailer/lib/smtp-transport';
import { env } from './env.js';

const { mailConfigEnv } = env;

// Hochschule Karlsruhe:   smtp.h-ka.de
// nullish coalescing
const host = mailConfigEnv.host ?? 'mailserver';
// HS Karlsruhe:   25
const portStr = mailConfigEnv.port ?? '5025';
const port = Number.parseInt(portStr, 10);
const loggerStr = mailConfigEnv.log;
const logger = loggerStr?.toLowerCase() === 'true';

/**
 * Konfiguration für den Mail-Client mit _nodemailer_.
 */
export const mailConfig: Options = {
    host,
    port,
    secure: false,

    // Googlemail:
    // service: 'gmail',
    // auth: {
    //     user: 'Meine.Benutzerkennung@gmail.com',
    //     pass: 'mypassword'
    // }

    priority: 'normal',
    logger,
};
Object.freeze(mailConfig);
console.info('mailConfig: %o', mailConfig);
