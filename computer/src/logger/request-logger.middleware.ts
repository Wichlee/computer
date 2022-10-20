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
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';
import { getLogger } from './logger.js';

/**
 * Die Middleware (-Funktion) wird vor dem "Route Handler" aufgerufen.
 * `RequestLoggerMiddleware` protokolliert die HTTP-Methode, die aufgerufene
 * URL und den Request-Header.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    readonly #logger = getLogger(RequestLoggerMiddleware.name);

    /**
     * @param req Request-Objekt von Express
     * @param _res Nicht-verwendetes Response-Objekt von Express
     * @param next Funktion der als nächstes aufzurufenden Middleware
     */
    use(req: Request, _res: Response, next: NextFunction) {
        const { method, originalUrl, headers } = req;
        this.#logger.debug(
            'method=%s, url=%s, header=%o',
            method,
            originalUrl,
            headers,
        );
        next();
    }
}
