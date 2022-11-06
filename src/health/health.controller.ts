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
 * Das Modul besteht aus der Controller-Klasse für Health-Checks.
 * @packageDocumentation
 */

import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
    TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Agent } from 'node:https';
import { ApiTags } from '@nestjs/swagger';
import { k8sConfig } from '../config/kubernetes.js';
import { nodeConfig } from '../config/node.js';

/**
 * Die Controller-Klasse für Health-Checks.
 */
@Controller('health')
@ApiTags('Health')
export class HealthController {
    readonly #health: HealthCheckService;

    readonly #http: HttpHealthIndicator;

    readonly #typeorm: TypeOrmHealthIndicator;

    readonly #schema = k8sConfig.detected && !k8sConfig.tls ? 'http' : 'https';

    readonly #httpsAgent = new Agent({
        requestCert: true,
        rejectUnauthorized: false,
        // cert aus interface HttpsOptions (von Nest) ist undefined
        ca: nodeConfig.httpsOptions?.cert as Buffer, // type-coverage:ignore-line
    });

    constructor(
        health: HealthCheckService,
        http: HttpHealthIndicator,
        typeorm: TypeOrmHealthIndicator,
    ) {
        this.#health = health;
        this.#http = http;
        this.#typeorm = typeorm;
    }

    @Get('live')
    @HealthCheck()
    live() {
        return this.#health.check([
            () =>
                this.#http.pingCheck(
                    'buch REST-API',
                    `${this.#schema}://${nodeConfig.host}:${
                        nodeConfig.port
                    }/api/00000000-0000-0000-0000-000000000001`,
                    { httpsAgent: this.#httpsAgent },
                ),
        ]);
    }

    @Get('ready')
    @HealthCheck()
    ready() {
        return this.#health.check([() => this.#typeorm.pingCheck('DB')]);
    }
}
