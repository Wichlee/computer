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

/**
 * Das Modul besteht aus Security-Funktionen für z.B. CSP, XSS, Click-Jacking,
 * HSTS und MIME-Sniffing, die durch Helmet bereitgestellt werden.
 * @packageDocumentation
 */

// Alternative zu helmet: lusca von Kraken
import {
    contentSecurityPolicy,
    frameguard,
    hidePoweredBy,
    hsts,
    noSniff,
    xssFilter,
} from 'helmet';

/**
 * Security-Funktionen für z.B. CSP, XSS, Click-Jacking, HSTS und MIME-Sniffing.
 */
// https://blog.appcanary.com/2017/http-security-headers.html
export const helmetHandlers = [
    // CSP = Content Security Policy
    //   https://www.owasp.org/index.php/HTTP_Strict_Transport_Security
    //   https://tools.ietf.org/html/rfc7762
    contentSecurityPolicy({
        useDefaults: true,
        directives: {
            defaultSrc: ["https: 'self'"],
            // fuer GraphQL IDE => GraphiQL
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
            scriptSrc: ["https: 'unsafe-inline' 'unsafe-eval'"],
            // fuer GraphQL IDE => GraphiQL
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/img-src
            imgSrc: ["data: 'self'"],
        },
        reportOnly: false,
    }),

    // XSS = Cross-site scripting attacks: Header X-XSS-Protection
    //   https://www.owasp.org/index.php/Cross-site_scripting
    xssFilter(),

    // Clickjacking
    //   https://www.owasp.org/index.php/Clickjacking
    //   http://tools.ietf.org/html/rfc7034
    frameguard(),

    // HSTS = HTTP Strict Transport Security:
    //   Header Strict-Transport-Security
    //   https://www.owasp.org/index.php/HTTP_Strict_Transport_Security
    //   https://tools.ietf.org/html/rfc6797
    hsts(),

    // MIME-sniffing: im Header X-Content-Type-Options
    //   https://blogs.msdn.microsoft.com/ie/2008/09/02/ie8-security-part-vi-beta-2-update
    //   http://msdn.microsoft.com/en-us/library/gg622941%28v=vs.85%29.aspx
    //   https://tools.ietf.org/html/rfc7034
    noSniff(),

    // Im Header z.B. "X-Powered-By: Express" unterdruecken
    hidePoweredBy(),
];
