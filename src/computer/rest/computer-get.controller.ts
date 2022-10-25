/* eslint-disable max-lines */
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

/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { type Computer, type ComputerFarbe, type ComputerModell } from '../entity/computer.entity.js';
import {
    ComputerReadService,
    type Suchkriterien,
} from '../service/computer-read.service.js';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';

// TypeScript
interface Link {
    href: string;
}
interface Links {
    self: Link;
    // optional
    list?: Link;
    add?: Link;
    update?: Link;
    remove?: Link;
}

// Interface fuer GET-Request mit Links fuer HATEOAS
export type ComputerModel = Omit<
    Computer,
    'aktualisiert' | 'erzeugt' | 'id' | 'version'
> & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

export interface ComputersModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        computers: ComputerModel[];
    };
}

/**
 * Klasse für `ComputerGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `ComputerController` hat dieselben Properties wie die Basisklasse
 * `Computer` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class ComputerQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly hersteller: string;

    @ApiProperty({ required: false })
    declare readonly computerModell: ComputerModell;

    @ApiProperty({ required: false })
    declare readonly herstelldatum: string;

    @ApiProperty({ required: false })
    declare readonly preis: number;
    
    @ApiProperty({ required: false })
    declare readonly computerFarbe: ComputerFarbe;

    @ApiProperty({ required: false })
    declare readonly seriennummer: string;
}

/**
 * Die Controller-Klasse für die Verwaltung von Computer.
 */
// Decorator in TypeScript, zur Standardisierung in ES vorgeschlagen (stage 3)
// https://github.com/tc39/proposal-decorators
@Controller()
// @UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Computer API')
// @ApiBearerAuth()
// Klassen ab ES 2015
export class ComputerGetController {
    // readonly in TypeScript, vgl. C#
    // private ab ES 2019
    readonly #service: ComputerReadService;

    readonly #logger = getLogger(ComputerGetController.name);

    // Dependency Injection (DI) bzw. Constructor Injection
    // constructor(private readonly service: ComputerReadService) {}
    constructor(service: ComputerReadService) {
        this.#service = service;
    }

    /**
     * Ein Computer wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es einen solchen Computer gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Computers gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird der gefundene
     * Computer im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es keinen Computer zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // vgl Kotlin: Schluesselwort "suspend"
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @ApiOperation({ summary: 'Suche mit der Computer-ID', tags: ['Suchen'] })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 00000000-0000-0000-0000-000000000001',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Der Computer wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Keinen Computer zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Der Computer wurde bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<ComputerModel | undefined>> {
        this.#logger.debug('findById: id=%s, version=%s"', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let computer: Computer | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            computer = await this.#service.findById(id);
        } catch (err) {
            // err ist implizit vom Typ "unknown", d.h. keine Operationen koennen ausgefuehrt werden
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (computer === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById(): computer=%o', computer);

        // ETags
        const versionDb = computer.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('findById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const computerModel = this.#toModel(computer, req);
        this.#logger.debug('findById: computerModel=%o', computerModel);
        return res.json(computerModel);
    }

    /**
     * Computer werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * einen solchen Computer gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Computern, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es keinen Computer zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Computer ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Suche mit Suchkriterien', tags: ['Suchen'] })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Computern' })
    async find(
        @Query() query: ComputerQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<ComputersModel | undefined>> {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const computers = await this.#service.find(query);
        this.#logger.debug('find: %o', computers);
        if (computers.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        // HATEOAS: Atom Links je Computer
        const computersModel = computers.map((computer : Computer )=>
            this.#toModel(computer, req, false),
        );
        this.#logger.debug('find: computersModel=%o', computersModel);

        const result: ComputersModel = { _embedded: { computers: computersModel } };
        return res.json(result).send();
    }

    #toModel(computer: Computer, req: Request, all = true) : ComputerModel {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = computer;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: computer=%o, links=%o', computer, links);
        /* eslint-disable unicorn/consistent-destructuring */
        const computerModel: ComputerModel = {
            titel: buch.titel,
            rating: buch.rating,
            art: buch.art,
            verlag: buch.verlag,
            preis: buch.preis,
            rabatt: buch.rabatt,
            lieferbar: buch.lieferbar,
            datum: buch.datum,
            isbn: buch.isbn,
            homepage: buch.homepage,
            _links: links,
        };
        /* eslint-enable unicorn/consistent-destructuring */

        return buchModel;
    }
}
/* eslint-enable max-lines */
