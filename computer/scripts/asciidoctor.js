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

// https://github.com/asciidoctor/asciidoctor.js
// https://asciidoctor-docs.netlify.com
// https://asciidoctor.org

import Asciidoctor from 'asciidoctor';
// https://github.com/eshepelyuk/asciidoctor-plantuml.js ist deprecated
import kroki from 'asciidoctor-kroki';
import { join } from 'node:path';
import url from 'node:url';

const asciidoctor = Asciidoctor();
console.log(`Asciidoctor.js ${asciidoctor.getVersion()}`);

kroki.register(asciidoctor.Extensions);

const options = {
    safe: 'safe',
    attributes: { linkcss: true },
    base_dir: 'extras/doc/entwicklerhandbuch',
    to_dir: 'html',
    mkdirs: true,
};
asciidoctor.convertFile(
    join('extras', 'doc', 'entwicklerhandbuch', 'entwicklerhandbuch.adoc'),
    options,
);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
console.log(
    `HTML-Datei ${join(
        __dirname,
        '..',
        'extras',
        'doc',
        'entwicklerhandbuch',
        'html',
        'entwicklerhandbuch.html',
    )}`,
);

// https://asciidoctor.github.io/asciidoctor.js/master
// const htmlString = asciidoctor.convert(
//     fs.readFileSync(join('extras', 'doc', 'entwicklerhandbuch.adoc')),
//     { safe: 'safe', attributes: { linkcss: true }, base_dir: 'doc' },
// );
// const htmlFile = join('extras', 'doc', 'entwicklerhandbuch.html');
// fs.writeFileSync(htmlFile, htmlString);

// console.log(`HTML-Datei ${join(__dirname, '..', htmlFile)}`);
