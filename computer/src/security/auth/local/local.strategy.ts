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
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../service/auth.service.js';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { getLogger } from '../../../logger/logger.js';

/**
 * Implementierung der _lokalen Strategie_ für Passport, so dass zu gegebenem
 * Benutzername und Passwort das `User`-Objekt ermittelt wird, falls das
 * mitgelieferte Passwort korrekt ist. Bei Passport http://www.passportjs.org
 * gibt es über 300 verschiedene Strategien.
 * `local` ist der Default-Name fuer _Passport Local Strategy_.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    readonly #authService: AuthService;

    readonly #logger = getLogger(LocalStrategy.name);

    /**
     * DI, so dass mit dem `AuthService` ein `User`-Objekt ermittelt werden
     * kann und dass dabei auch protokolliert werden kann.
     */
    constructor(authService: AuthService) {
        // Passport verwendet als Default die Properties "username"und "password"
        // http://www.passportjs.org/docs/configure
        super();
        this.#authService = authService;
    }

    /**
     * Validierung beim Login gemäß Passport, d.h. zu gegebenem Benutzername und
     * Passwort wird das `User`-Objekt ermittelt, falls das mitgelieferte Passwort
     * korrekt ist.
     * `AuthController.login()` ist dekoriert mit `@UseGuards(LocalAuthGuard)`.
     * Die Aufrufkette `LocalStrategy.validate() -> AuthService.validate()`
     * liefert `User` oder `UnauthorizedException
     * @param username Benutzername
     * @param password Passwort
     * @return Das User-Objekt bei erfolgreicher Validierung. Passwort verwendet
     *  den allgemeinen Typ any.^
     * @throws UnauthorizedException
     */
    async validate(username: string, password: string): Promise<any> {
        this.#logger.debug('validate: username=%s, password=*****', username); //NOSONAR
        const user = await this.#authService.validate(username, password);
        if (user === undefined) {
            this.#logger.debug('validate: user=undefined');
        } else {
            this.#logger.debug('validate: user=%o', user);
        }
        if (user === undefined) {
            // Zur userid in der Payload des Tokens gibt es keinen User
            // Was ist das fuer ein Token? Wer verwendet einen solchen Token?!
            // Deshalb: KEINE Information liefern, dass es keinen User gibt
            //          d.h. nicht 401 sondern 403 als Statuscode
            throw new UnauthorizedException();
        }
        return user;
    }
}
