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
import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type BasicUser } from './jwt.strategy.js';
import { type Request } from 'express';
import { getLogger } from '../../../logger/logger.js';

export type RequestWithUser = Request & { user?: BasicUser };

/**
 * Das Guard stellt sicher, dass bei einem Request an der REST-Schnittstelle ein
 * gültiger JWT verwendet wird, d.h. dass der/die Endbenutzer/in sich in der
 * Vergangenheit eingeloggt und einen Token erhalten hat, der jetzt im Header
 * "Authorization" mitgeschickt wird. Der Token wird mit der konfigurierten
 * Strategie verifiziert und das zugehörige User-Objekt wird im Request-Objekt
 * gespeichert, damit in `RolesGuard` die Rollen bzw. Zugriffsrechte überprüft
 * werden, wenn in einem Controller @Roles() verwendet wird.
 *
 * https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
 * https://docs.nestjs.com/security/authentication#extending-guards
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    readonly #logger = getLogger(JwtAuthGuard.name);

    /**
     * Die geerbte Methode wird überschrieben, damit das User-Objekt aus
     * `JwtStrategy.validate()` im Request-Objekt gespeichert wird.
     * @param _err wird nicht benutzt
     * @param user das User-Objekt, das durch `JwtStrategy.validate()`
     *             aus der Payload ermittelt wurde.
     * @param _info wird nicht benutzt
     * @param context der Ausführungskontext, mit dem das Request-Objekt
     * ermittelt wird
     */
    // eslint-disable-next-line max-params
    override handleRequest(
        _err: unknown,
        user: any, // type-coverage:ignore-line
        _info: unknown,
        context: ExecutionContext,
    ) {
        this.#logger.debug('handleRequest: user=%o', user); // type-coverage:ignore-line
        const request: RequestWithUser = context.switchToHttp().getRequest();
        request.user = user as BasicUser;
        // type-coverage:ignore-next-line
        return user; // eslint-disable-line @typescript-eslint/no-unsafe-return
    }
}
