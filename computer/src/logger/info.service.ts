/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
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
 * Das Modul enthält die Funktion, um die Test-DB neu zu laden.
 * @packageDocumentation
 */

import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { release, type, userInfo } from 'node:os';
import RE2 from 're2';
import { getLogger } from './logger.js';
import { hash } from 'argon2';
import { k8sConfig } from '../config/kubernetes.js';
import { nodeConfig } from '../config/node.js';
import process from 'node:process';

/**
 * Die Test-DB wird im Development-Modus neu geladen, nachdem die Module
 * initialisiert sind, was duch `OnApplicationBootstrap` realisiert wird.
 */
@Injectable()
export class InfoService implements OnApplicationBootstrap {
    readonly #banner = `
        .       __                                    _____
        .      / /_  _____  _________ ____  ____     /__  /
        . __  / / / / / _ \\/ ___/ __ \`/ _ \\/ __ \\      / /
        ./ /_/ / /_/ /  __/ /  / /_/ /  __/ / / /     / /___
        .\\____/\\__,_/\\___/_/   \\__, /\\___/_/ /_/     /____(_)
        .                     /____/
    `;

    readonly #logger = getLogger(InfoService.name);

    /**
     * Die Test-DB wird im Development-Modus neu geladen.
     */
    async onApplicationBootstrap() {
        const { host, httpsOptions, nodeEnv, port, serviceHost, servicePort } =
            nodeConfig;
        const isK8s = k8sConfig.detected;
        const plattform = isK8s
            ? `Kubernetes: BUCH_SERVICE_HOST=${serviceHost}, BUCH_SERVICE_PORT=${servicePort}`
            : 'Kubernetes: N/A';

        this.#logger.info(this.#stripIndent(this.#banner));
        // https://nodejs.org/api/process.html
        // "Template String" ab ES 2015
        this.#logger.info('Node: %s', process.version);
        this.#logger.info('NODE_ENV: %s', nodeEnv);
        this.#logger.info(plattform);

        const desPods = isK8s ? ' des Pods' : '';
        this.#logger.info('Rechnername%s: %s', desPods, host);
        this.#logger.info('Port%s: %s', desPods, port);
        this.#logger.info(
            '%s',
            httpsOptions === undefined ? 'HTTP (ohne TLS)' : 'HTTPS',
        );
        this.#logger.info('Betriebssystem: %s (%s)', type(), release());
        this.#logger.info('Username: %s', userInfo().username);

        // const options: argon2.Options = {...};
        const hashValue = await hash('p');
        this.#logger.debug('argon2id: p -> %s', hashValue);
    }

    #stripIndent(string: string) {
        // https://github.com/jamiebuilds/min-indent/blob/master/index.js
        // \S = kein Whitespace
        // g = global, m = multiline, u = unicode
        // Array mit den Leerzeichen oder Tabs jeweils am Zeilenanfang
        const leerzeichenArray = string.match(/^[ \t]*(?=\S)/gmu);
        if (leerzeichenArray === null) {
            return string;
        }

        let indent = Number.POSITIVE_INFINITY;
        leerzeichenArray.forEach((leerzeichenStr) => {
            indent = Math.min(indent, leerzeichenStr.length);
        });

        if (indent === 0) {
            return string;
        }

        // https://github.com/sindresorhus/strip-indent/blob/main/index.js
        // g = global, m = multiline, u = unicode
        const regex = new RE2(`^[ \\t]{${indent}}`, 'gmu');
        return string.replace(regex, '');
    }
}
