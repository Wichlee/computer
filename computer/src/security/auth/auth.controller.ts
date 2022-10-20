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
 * Das Modul besteht aus der Controller-Klasse für die Authentifizierung an der
 * REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard, type RequestWithUser } from './jwt/jwt-auth.guard.js';
import { Request, Response } from 'express';
import { AuthService } from './service/auth.service.js';
import { LocalAuthGuard } from './local/local-auth.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UserService } from './service/user.service.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

class Login {
    // https://docs.nestjs.com/openapi/types-and-parameters
    @ApiProperty({ example: 'admin', type: String })
    username: string | undefined;

    @ApiProperty({ example: 'p', type: String })
    password: string | undefined;
}

/**
 * Die Controller-Klasse für die Authentifizierung.
 */
@Controller(paths.auth)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('auth')
export class AuthController {
    readonly #authService: AuthService;

    readonly #userService: UserService;

    readonly #logger = getLogger(AuthController.name);

    constructor(authService: AuthService, userService: UserService) {
        this.#authService = authService;
        this.#userService = userService;
    }

    /**
     * Im Rumpf des Request-Objekts stehen Benutzername und Passwort, um sich
     * einzuloggen. Das Einloggen erfolgt über Passport, was durch `@UseGuards`
     * realisiert ist. Dabei wird zunächst das Passwort mit
     * `AuthService.validate()` überprüft und danach wird das
     * User-Objekt in der Property "user" des Request-Objekts hinterlegt.
     * Damit kann nun das eigentliche Einloggen in `AuthService.login` erfolgen.
     *
     * Falls das Einloggen erfolgreich war, wird der Statuscode `200` (`OK`)
     * zurückgeliefert. Im Rumpf steht dann der _JSON Web Token_, der
     * Zeitstempel für das Ablaufdatum (`expiresIn`) und ein JSON-Array mit den
     * Rollen.
     *
     * Falls das Einloggen nicht erfolgreich war, wird der Statuscode `401`
     * (`Unauthorized`) zurückgeliefert.
     *
     * @param req Request-Objekt von Express mit Property "user" durch Passport
     * @param res Leeres Response-Objekt von Express.
     * @param body _nur für OpenAPI_: Request-Body von Express.
     */
    @Post(paths.login)
    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({ summary: 'Login mit Benutzername und Passwort' })
    @ApiOkResponse({ description: 'Erfolgreich eingeloggt.' })
    @ApiUnauthorizedResponse({
        description: 'Benutzername oder Passwort sind falsch.',
    })
    async login(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: Login,
    ) {
        this.#logger.debug('login: username=%o', body.username);
        const result = await this.#authService.login(req.user);

        this.#logger.debug('login: 200');
        return res.json(result).send();
    }

    @Get(paths.roles)
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Rollen zum User des Tokens ermitteln' })
    @ApiOkResponse({ description: 'Die Rollen zum User.' })
    @ApiNotFoundResponse({ description: 'Keine Rollen zum User.' })
    @ApiBearerAuth()
    async getRoles(@Req() req: Request, @Res() res: Response) {
        const reqUser = (req as RequestWithUser).user;
        this.#logger.debug('getRoles: reqUser=%o', reqUser);
        if (reqUser === undefined) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const user = await this.#userService.findById(reqUser.userId);
        this.#logger.debug('getRoles: user=%o', user);
        if (user?.roles === undefined) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        const { roles } = user;
        this.#logger.debug('getRoles: roles=%o', roles);
        if (roles.length === 0) {
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }
        return res.json(roles).send();
    }
}
