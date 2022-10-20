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
 * Das Modul besteht aus der Klasse {@linkcode MailService} für das
 * Verschicken von Emails.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { type SendMailOptions } from 'nodemailer';
import { cloud } from '../config/cloud.js';
import { getLogger } from '../logger/logger.js';
import { mailConfig } from '../config/mail.js';

@Injectable()
export class MailService {
    readonly #logger = getLogger(MailService.name);

    async sendmail(subject: string, body: string) {
        if (cloud !== undefined || mailConfig.host === 'skip') {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Joe Doe" <Joe.Doe@acme.com>';
        const to = '"Foo Bar" <Foo.Bar@acme.com>';

        const data: SendMailOptions = { from, to, subject, html: body };
        this.#logger.debug('#sendMail: data=%o', data);

        try {
            const nodemailer = await import('nodemailer');
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err) {
            this.#logger.warn('#sendmail: Fehler %o', err);
        }
    }
}
