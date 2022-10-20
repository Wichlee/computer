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
 * Das Modul besteht aus der Controller-Klasse für das Neuladen der DB.
 * @packageDocumentation
 */

import {
    Controller,
    HttpStatus,
    Post,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { DbPopulateService } from './db-populate.service.js';
import { JwtAuthGuard } from '../../security/auth/jwt/jwt-auth.guard.js';
import { Response } from 'express';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { Roles } from '../../security/auth/roles/roles.decorator.js';
import { RolesGuard } from '../../security/auth/roles/roles.guard.js';

/**
 * Die Controller-Klasse für das Neuladen der DB.
 */
@Controller('dbPopulate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseInterceptors(ResponseTimeInterceptor)
export class DbPopulateController {
    readonly #service: DbPopulateService;

    constructor(service: DbPopulateService) {
        this.#service = service;
    }

    @Post()
    async dbPopulate(@Res() res: Response): Promise<Response> {
        await this.#service.populateTestdaten();
        return res.sendStatus(HttpStatus.OK);
    }
}
