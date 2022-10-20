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
import { AuthModule } from '../security/auth/auth.module.js';
import { Buch } from './entity/buch.entity.js';
import { BuchGetController } from './rest/buch-get.controller.js';
import { BuchMutationResolver } from './graphql/buch-mutation.resolver.js';
import { BuchQueryResolver } from './graphql/buch-query.resolver.js';
import { BuchReadService } from './service/buch-read.service.js';
import { BuchValidationService } from './service/buch-validation.service.js';
import { BuchWriteController } from './rest/buch-write.controller.js';
import { BuchWriteService } from './service/buch-write.service.js';
import { MailModule } from '../mail/mail.module.js';
import { Module } from '@nestjs/common';
import { QueryBuilder } from './service/query-builder.js';
import { Schlagwort } from './entity/schlagwort.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Bücher.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [
        MailModule,
        // siehe auch src\app.module.ts
        TypeOrmModule.forFeature([Buch, Schlagwort]),
        AuthModule,
    ],
    controllers: [BuchGetController, BuchWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        BuchReadService,
        BuchWriteService,
        BuchValidationService,
        BuchQueryResolver,
        BuchMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [BuchReadService, BuchWriteService, BuchValidationService],
})
export class BuchModule {}
