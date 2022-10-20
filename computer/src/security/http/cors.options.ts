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
import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsOptions: CorsOptions = {
    // Access-Control-Allow-Origin (nur Requests von origin zulassen)
    origin: ['https://studio.apollographql.com', 'http://localhost:4200'],
    // origin: true,

    // Access-Control-Allow-Methods (hier: default)
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    // Access-Control-Allow-Headers
    allowedHeaders: [
        'Origin',
        'Accept',
        'Content-Type',
        'Authorization',
        'Allow',
        'Content-Length',
        'Date',
        'If-Match',
        'If-Not-Match',
        'sec-fetch-mode',
        'sec-fetch-site',
        'sec-fetch-dest',
    ],
    // Access-Control-Expose-Headers
    exposedHeaders: [
        'Content-Type',
        'Content-Length',
        'ETag',
        'Location',
        'Date',
        'Last-Modified',
        'Access-Control-Allow-Origin',
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
    ],
    // Access-Control-Max-Age: 24 * 60 * 60
    maxAge: 86_400,
};
