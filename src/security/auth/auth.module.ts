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
import { AuthController } from './auth.controller.js';
import { AuthService } from './service/auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy.js';
import { LocalStrategy } from './local/local.strategy.js';
import { LoginResolver } from './login.resolver.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserService } from './service/user.service.js';
import { jwtConfig } from '../../config/jwt.js';

const { privateKey, signOptions, verifyOptions } = jwtConfig;

/**
 * Das Modul besteht aus den Klassen für die Authentifizierung.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse, so dass u.a. die Klasse `AuthService` injiziert
 * werden kann.
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        // https://stackoverflow.com/questions/55091698/nestjs-passport-jwtstrategy-never-being-called-with-rs256-tokens
        JwtModule.register({ privateKey, signOptions, verifyOptions }),
    ],
    controllers: [AuthController],
    // Provider sind z.B. injizierbare Klassen (Service-Klassen)
    providers: [
        AuthService,
        UserService,
        LocalStrategy,
        JwtStrategy,
        LoginResolver,
    ],
    exports: [AuthService, UserService],
})
export class AuthModule {}
