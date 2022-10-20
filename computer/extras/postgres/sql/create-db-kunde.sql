-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- (1) PostgreSQL NICHT als user "postgres" starten, sondern implizit als "root"
--     d.h. auskommentieren in docker-compose.yaml
-- (2) docker compose exec postgres sh
-- (3) chown postgres:postgres /var/lib/postgresql/tablespace
-- (4) chown postgres:postgres /var/lib/postgresql/tablespace/kunde
-- (5) docker compose down
-- (6) in docker-compose.yaml den User "postgres" wieder aktivieren
-- (7) docker compose up
-- (8) docker compose exec postgres sh
-- (9) psql --dbname=postgres --username=postgres --file=/sql/create-db-kunde.sql
-- (10) exit

-- https://www.postgresql.org/docs/current/sql-createrole.html
CREATE ROLE kunde LOGIN PASSWORD 'p';

-- https://www.postgresql.org/docs/current/sql-createdatabase.html
CREATE DATABASE kunde;

-- https://www.postgresql.org/docs/current/sql-grant.html
GRANT ALL ON DATABASE kunde TO kunde;

-- https://www.postgresql.org/docs/10/sql-createtablespace.html
CREATE TABLESPACE kundespace OWNER kunde LOCATION '/var/lib/postgresql/tablespace/kunde';
