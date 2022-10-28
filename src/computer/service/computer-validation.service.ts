/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

// https://json-schema.org/implementations.html

/**
 * Das Modul besteht aus der Klasse {@linkcode ComputerValidationService}.
 * @packageDocumentation
 */

// Ajv wird auch von Fastify genutzt
// Ajv hat ca 75 Mio Downloads/Woche, classvalidator (Nest, aehnlich Hibernate Validator) nur 1,5 Mio
// https://ajv.js.org/guide/schema-language.html#draft-2019-09-and-draft-2012-12
// https://github.com/ajv-validator/ajv/blob/master/docs/validation.md
import Ajv2020 from 'ajv/dist/2020.js';
import { type Computer } from '../entity/computer.entity.js';
import { type FormatValidator } from 'ajv/dist/types/index.js';
import { Injectable } from '@nestjs/common';
import RE2 from 're2';
import ajvErrors from 'ajv-errors';
import formatsPlugin from 'ajv-formats';
import { getLogger } from '../../logger/logger.js';
import { jsonSchema } from './jsonSchema.js';

export const ID_PATTERN = new RE2(
    '^[\\dA-Fa-f]{8}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{12}$',
);
@Injectable()
export class ComputerValidationService {
    #ajv = new Ajv2020({
        allowUnionTypes: true,
        allErrors: true,
    });

    readonly #logger = getLogger(ComputerValidationService.name);

    constructor() {
        // https://github.com/ajv-validator/ajv-formats#formats
        formatsPlugin(this.#ajv, ['date', 'email', 'uri']);
        ajvErrors(this.#ajv);
        this.#ajv.addFormat('Seriennummer', {
            type: 'string',
            validate: this.#validateSeriennummer,
        });
    }

    validateId(id: string) {
        return ID_PATTERN.test(id);
    }

    // https://github.com/ajv-validator/ajv-formats/issues/14#issuecomment-826340298
    #validateSeriennummer: FormatValidator<string> = (subject: string) => {
        // Checks for serial number format
        const regex = /PC-\d{2}[A-Z]{2}\d[A-Z]/u; //NOSONAR

        if (regex.test(subject)) {
            return true;
        }

        return false;
    };

    /**
     * Funktion zur Validierung, wenn neue Computer angelegt oder vorhandene Computer
     * aktualisiert bzw. überschrieben werden sollen.
     */
    validate(computer: Computer) {
        this.#logger.debug('validate: computer=%o', computer);
        const validate = this.#ajv.compile<Computer>(jsonSchema);
        validate(computer);

        // nullish coalescing
        const errors = validate.errors ?? [];
        const messages = errors
            .map((error) => error.message)
            .filter((msg) => msg !== undefined);
        this.#logger.debug(
            'validate: errors=%o, messages=%o',
            errors,
            messages,
        );
        return messages.length > 0 ? (messages as string[]) : undefined;
    }
}
