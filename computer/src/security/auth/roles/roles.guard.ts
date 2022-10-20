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
    type CanActivate,
    type ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator.js';
import { Reflector } from '@nestjs/core';
import { type RequestWithUser } from '../jwt/jwt-auth.guard.js';
import { type Role } from '../service/role.js';
import { UserService } from '../service/user.service.js';
import { getLogger } from '../../../logger/logger.js';

/**
 * Guard für RBAC (= role-based access control), so dass der Decorater `@Role()`
 * verwendet werden kann.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    readonly #reflector: Reflector;

    readonly #userService: UserService;

    readonly #logger = getLogger(RolesGuard.name);

    constructor(reflector: Reflector, userService: UserService) {
        this.#reflector = reflector;
        this.#userService = userService;
    }

    /**
     * Die Rollen im Argument des Decorators `@Role()` ermitteln.
     * @param context Der Ausführungskontext zur Ermittlung der Metadaten bzw.
     * des Decorators.
     * @return true, falls die Rollen beim Controller oder bei der dekorierten
     * Funktion durch den JWT gegeben sind.
     */
    async canActivate(context: ExecutionContext) {
        // https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
        const requiredRoles: Role[] | undefined =
            this.#reflector.getAllAndOverride(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
        if (requiredRoles === undefined) {
            this.#logger.debug('canActivate: requiredRoles=undefined');
        } else {
            this.#logger.debug('canActivate: requiredRoles=%o', requiredRoles);
        }
        if (requiredRoles === undefined || requiredRoles.length === 0) {
            return true;
        }

        const request: RequestWithUser = context.switchToHttp().getRequest();
        const basicUser = request.user;
        if (basicUser === undefined) {
            this.#logger.debug('canActivate: basicUser=undefined');
            return false;
        }
        this.#logger.debug('canActivate: basicUser=%o', basicUser);

        const { userId } = basicUser;
        const user = await this.#userService.findById(userId);
        if (user === undefined) {
            this.#logger.debug('canActivate: user=undefined');
            return false;
        }

        this.#logger.debug('canActivate: user=%o', user);
        return requiredRoles.some((role) => user.roles.includes(role));
    }
}
