/*
 * Copyright (C) 2017 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import fs from 'node:fs';
import fsExtra from 'fs-extra';
import path from 'node:path';

const { copyFileSync, mkdirSync } = fs;
const { copySync } = fsExtra;
const { join } = path

// BEACHTE: "assets" innerhalb von nest-cli.json werden bei "--watch" NICHT beruecksichtigt
// https://docs.nestjs.com/cli/monorepo#global-compiler-options

const src = 'src';
const dist = 'dist';
if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
}

const configSrc = join(src, 'config');
const configDist = join(dist, src, 'config');

// DB-Skripte kopieren
const devSrc = join(configSrc, 'dev');
const postgresSrc = join(devSrc, 'postgres');
const mysqlSrc = join(devSrc, 'mysql');
const devDist = join(configDist, 'dev');
const postgresDist = join(devDist, 'postgres');
const mysqlDist = join(devDist, 'mysql');
mkdirSync(postgresDist, { recursive: true });
mkdirSync(mysqlDist, { recursive: true });
copySync(postgresSrc, postgresDist);
copySync(mysqlSrc, mysqlDist);

// PEM-Dateien fuer JWT kopieren
const jwtPemSrc = join(configSrc, 'jwt');
const jwtPemDist = join(configDist, 'jwt');
mkdirSync(jwtPemDist, { recursive: true });
copySync(jwtPemSrc, jwtPemDist);

// GraphQL-Schema kopieren
const businessDir = 'computer'
const graphqlSrc = join(src, businessDir, 'graphql');
const graphqlDist = join(dist, src, businessDir, 'graphql');
mkdirSync(graphqlDist, { recursive: true });
copyFileSync(join(graphqlSrc, 'schema.graphql'), join(graphqlDist, 'schema.graphql'));

const graphqlAuthSrc = join(src, 'security', 'auth');
const graphqlAuthDist = join(dist, src, 'security', 'auth');
mkdirSync(graphqlAuthDist, { recursive: true });
copyFileSync(join(graphqlAuthSrc, 'login.graphql'), join(graphqlAuthDist, 'login.graphql'));
