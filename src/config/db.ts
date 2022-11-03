/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul enthält die Konfiguration für den Zugriff auf die DB.
 * @packageDocumentation
 */

import { Computer } from '../computer/entity/computer.entity.js';
import { type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { env } from './env.js';
import { k8sConfig } from './kubernetes.js';
import { nodeConfig } from './node.js';

const { dbConfigEnv } = env;

// nullish coalescing
const database = dbConfigEnv.name ?? Computer.name.toLowerCase();
const { detected } = k8sConfig;
const dbType =
    dbConfigEnv.type === undefined || dbConfigEnv.type === 'postgres'
        ? 'postgres'
        : 'mysql';
const host = detected ? dbType : dbConfigEnv.host ?? 'localhost';
const username = dbConfigEnv.username ?? Computer.name.toLowerCase();
const pass = dbConfigEnv.password ?? 'p';

export const typeOrmModuleOptions: TypeOrmModuleOptions =
    dbType === 'postgres'
        ? {
              type: 'postgres',
              host,
              port: 5432,
              username,
              password: pass,
              database,
              // siehe auch src\computer\computer.module.ts
              entities: [Computer],
              // logging durch console.log()
              logging:
                  nodeConfig.nodeEnv === 'development' ||
                  nodeConfig.nodeEnv === 'test',
              logger: 'advanced-console',
          }
        : {
              type: 'mysql',
              host,
              port: 3306,
              username,
              password: pass,
              database,
              // siehe auch src\computer\computer.module.ts
              entities: [Computer],
              supportBigNumbers: true,
              // logging durch console.log()
              logging:
                  nodeConfig.nodeEnv === 'development' ||
                  nodeConfig.nodeEnv === 'test',
              logger: 'advanced-console',
          };

const { password, ...typeOrmModuleOptionsLog } = typeOrmModuleOptions;
console.info('typeOrmModuleOptions: %o', typeOrmModuleOptionsLog);

export const dbPopulate = dbConfigEnv.populate?.toLowerCase() === 'true';
