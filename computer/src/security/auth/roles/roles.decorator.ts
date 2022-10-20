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
import { type Role } from '../service/role.js';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Rest Parameter: beliebig viele Parameter als Array zusammenfassen, seit ES 2015
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
