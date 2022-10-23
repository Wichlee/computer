#!/bin/bash
# Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# (1) PostgreSQL NICHT als user "postgres" starten, sondern implizit als "root"
#     d.h. auskommentieren in docker-compose.yaml
# (2) docker compose exec postgres bash
# (3) chown postgres:postgres /var/lib/postgresql/tablespace
# (4) chown postgres:postgres /var/lib/postgresql/tablespace/computer

# docker compose exec postgres bash /scripts/create-db-computer.sh
psql --dbname=postgres --username=postgres --file=/scripts/create-db-computer.sql
