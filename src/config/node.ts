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
 * Das Modul enthält die Konfiguration für den _Node_-basierten Server.
 * @packageDocumentation
 */

import { type HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { cloud } from './cloud.js';
import { env } from './env.js';
import { hostname } from 'node:os';
import { k8sConfig } from './kubernetes.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { nodeConfigEnv } = env;

const computername = hostname();
let port = Number.NaN;
const portStr = nodeConfigEnv.port;
if (portStr !== undefined) {
    port = Number.parseInt(portStr, 10);
}
if (Number.isNaN(port)) {
    // PORT ist zwar gesetzt, aber keine Zahl
    port = 3000; // eslint-disable-line @typescript-eslint/no-magic-numbers
}

// https://nodejs.org/api/fs.html
// https://nodejs.org/api/path.html
// http://2ality.com/2017/11/import-meta.html
const usePKI = cloud === undefined && (!k8sConfig.detected || k8sConfig.tls);

// fuer z.B. PEM-Dateien fuer TLS
const srcDir = k8sConfig.detected ? resolve('dist', 'src') : 'src';

// fuer public/private keys: TLS und JWT
export const configDir = resolve(srcDir, 'config');
const tlsDir = resolve(configDir, 'tls');

const key = usePKI
    ? readFileSync(resolve(tlsDir, 'private-key.pem'))
    : undefined;
const cert = usePKI
    ? readFileSync(resolve(tlsDir, 'certificate.cer'))
    : undefined;

let httpsOptions: HttpsOptions | undefined;
if (cloud === undefined) {
    if (k8sConfig.detected && !k8sConfig.tls) {
        console.debug('HTTP: Lokaler Kubernetes-Cluster');
    } else {
        console.debug('HTTPS: On-Premise oder Kubernetes-Cluster');
        if (key === undefined || cert === undefined) {
            console.warn('Key und/oder Zertifikat fehlen');
        } else {
            httpsOptions = {
                // Shorthand Properties:   key: key
                key,
                cert,
            };
        }
    }
}

const { nodeEnv, serviceHost, servicePort } = nodeConfigEnv;

interface NodeConfig {
    readonly host: string;
    readonly port: number;
    readonly configDir: string;
    readonly httpsOptions: HttpsOptions | undefined;
    readonly nodeEnv: 'development' | 'production' | 'test' | undefined;
    readonly serviceHost: string | undefined;
    readonly servicePort: string | undefined;
}

/**
 * Die Konfiguration für den _Node_-basierten Server:
 * - Rechnername
 * - IP-Adresse
 * - Port
 * - `PEM`- und Zertifikat-Datei mit dem öffentlichen und privaten Schlüssel
 *   für TLS
 */
export const nodeConfig: NodeConfig = {
    // Shorthand Property ab ES 2015
    host: computername,
    port,
    configDir,
    httpsOptions,
    nodeEnv: nodeEnv as 'development' | 'production' | 'test' | undefined,
    serviceHost,
    servicePort,
};

// "unknown" bedeutet, dass keine Operationen mit dem Datentyp ausgefuehrt werden
const logNodeConfig: Record<string, unknown> = {
    host: computername,
    port,
    configDir,
    nodeEnv,
};
console.info('nodeConfig: %o', logNodeConfig);
