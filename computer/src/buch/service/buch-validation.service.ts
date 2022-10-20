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
 * Das Modul besteht aus der Klasse {@linkcode BuchValidationService}.
 * @packageDocumentation
 */

// Ajv wird auch von Fastify genutzt
// Ajv hat ca 75 Mio Downloads/Woche, classvalidator (Nest, aehnlich Hibernate Validator) nur 1,5 Mio
// https://ajv.js.org/guide/schema-language.html#draft-2019-09-and-draft-2012-12
// https://github.com/ajv-validator/ajv/blob/master/docs/validation.md
import Ajv2020 from 'ajv/dist/2020.js';
import { type Buch } from '../entity/buch.entity.js';
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
export class BuchValidationService {
    #ajv = new Ajv2020({
        allowUnionTypes: true,
        allErrors: true,
    });

    readonly #logger = getLogger(BuchValidationService.name);

    constructor() {
        // https://github.com/ajv-validator/ajv-formats#formats
        formatsPlugin(this.#ajv, ['date', 'email', 'uri']);
        ajvErrors(this.#ajv);
        this.#ajv.addFormat('ISBN', {
            type: 'string',
            validate: this.#validateISBN,
        });
    }

    validateId(id: string) {
        return ID_PATTERN.test(id);
    }

    #checkChars(chars: string[]) {
        /* eslint-disable @typescript-eslint/no-magic-numbers, unicorn/no-for-loop, security/detect-object-injection */
        let sum = 0;
        let check: number | string;

        if (chars.length === 9) {
            // Compute the ISBN-10 check digit
            chars.reverse();
            for (let i = 0; i < chars.length; i++) {
                sum += (i + 2) * Number.parseInt(chars[i] ?? '', 10);
            }
            check = 11 - (sum % 11); // eslint-disable-line @typescript-eslint/no-extra-parens
            if (check === 10) {
                check = 'X';
            } else if (check === 11) {
                check = '0';
            }
        } else {
            // Compute the ISBN-13 check digit
            for (let i = 0; i < chars.length; i++) {
                sum += ((i % 2) * 2 + 1) * Number.parseInt(chars[i] ?? '', 10); // eslint-disable-line @typescript-eslint/no-extra-parens
            }
            check = 10 - (sum % 10); // eslint-disable-line @typescript-eslint/no-extra-parens
            if (check === 10) {
                check = '0';
            }
        }
        return check;
        /* eslint-enable @typescript-eslint/no-magic-numbers, unicorn/no-for-loop, security/detect-object-injection */
    }

    // https://github.com/ajv-validator/ajv-formats/issues/14#issuecomment-826340298
    #validateISBN: FormatValidator<string> = (subject: string) => {
        // Checks for ISBN-10 or ISBN-13 format
        // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
        /* eslint-disable max-len, unicorn/no-unsafe-regex, security/detect-unsafe-regex, regexp/no-super-linear-backtracking */
        const regex =
            /^(?:ISBN(?:-1[03])?:? )?(?=[\dX]{10}$|(?=(?:\d+[- ]){3})[- \dX]{13}$|97[89]\d{10}$|(?=(?:\d+[- ]){4})[- \d]{17}$)(?:97[89][- ]?)?\d{1,5}[- ]?\d+[- ]?\d+[- ]?[\dX]$/u; //NOSONAR
        /* eslint-enable max-len, unicorn/no-unsafe-regex, security/detect-unsafe-regex, regexp/no-super-linear-backtracking */

        if (regex.test(subject)) {
            // Remove non ISBN digits, then split into an array
            const chars = subject
                .replace(/[ -]|^ISBN(?:-1[03])?:?/gu, '')
                .split(''); // eslint-disable-line unicorn/prefer-spread
            // Remove the final ISBN digit from `chars`, and assign it to `last`
            const last = chars.pop();

            const check = this.#checkChars(chars);

            // eslint-disable-next-line eqeqeq
            if (check == last) {
                return true;
            }
        }

        return false;
    };

    /**
     * Funktion zur Validierung, wenn neue Bücher angelegt oder vorhandene Bücher
     * aktualisiert bzw. überschrieben werden sollen.
     */
    validate(buch: Buch) {
        this.#logger.debug('validate: buch=%o', buch);
        const validate = this.#ajv.compile<Buch>(jsonSchema);
        validate(buch);

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
