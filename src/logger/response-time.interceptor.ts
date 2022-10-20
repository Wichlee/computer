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
import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    type NestInterceptor,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { type Response } from 'express';
import { type TapObserver } from 'rxjs/internal/operators/tap';
import { Temporal } from '@js-temporal/polyfill';
import { getLogger } from './logger.js';
import { tap } from 'rxjs/operators';

/**
 * `ResponseTimeInterceptor` protokolliert die Antwortzeit und den Statuscode
 * Alternative zu morgan (von Express) http://expressjs.com/en/resources/middleware/morgan.html,
 * aber mit konformem Log-Layout.
 */
@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
    readonly #logger = getLogger(ResponseTimeInterceptor.name);

    readonly #empty = () => {
        /* do nothing */
    };

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = Temporal.Now.instant().epochMilliseconds;
        const responseTimeObserver: TapObserver<unknown> = {
            subscribe: this.#empty,
            unsubscribe: this.#empty,
            finalize: () => {
                const response = context.switchToHttp().getResponse<Response>();
                const { statusCode, statusMessage } = response;
                const responseTime =
                    Temporal.Now.instant().epochMilliseconds - start;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (statusMessage === undefined) {
                    // GraphQL
                    this.#logger.debug('Response time: %d ms', responseTime);
                    return;
                }
                this.#logger.debug(
                    'Response time: %d ms, %d %s',
                    responseTime,
                    statusCode,
                    statusMessage,
                );
            },
            next: this.#empty,
            error: this.#empty,
            complete: this.#empty,
        };
        // tap() ist ein Operator fuer Seiteneffekte
        return next.handle().pipe(tap(responseTimeObserver));
    }
}
