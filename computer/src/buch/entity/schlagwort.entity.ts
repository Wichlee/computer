/*
 * Copyright (C) 2016 - present Juergen Zimmermann, FLorian Goebel, Hochschule Karlsruhe
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
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Buch } from './buch.entity.js';

/**
 * Entity-Klasse zu einem relationalen Tabelle
 */
@Entity()
export class Schlagwort {
    @Column('char')
    @PrimaryColumn('uuid')
    id: string | undefined;

    // https://typeorm.io/many-to-one-one-to-many-relations
    @ManyToOne(() => Buch, (buch) => buch.schlagwoerter)
    // https://typeorm.io/relations#joincolumn-options
    @JoinColumn({ name: 'buch_id' })
    readonly buch: Buch | null | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Das Schlagwort', type: String })
    readonly schlagwort: string | null | undefined; //NOSONAR
}
