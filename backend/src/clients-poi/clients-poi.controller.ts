import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientsPoiService, type UpsertClientPoiBody } from './clients-poi.service';

@Controller('api/clients-poi')
export class ClientsPoiController {
  constructor(private readonly clientsPoiService: ClientsPoiService) {}

  /** Liste tous les POIs (dépôts + clients). */
  @Get()
  list() {
    return this.clientsPoiService.findAll();
  }

  /** Liste uniquement les dépôts (table depots). */
  @Get('depots')
  listDepots() {
    return this.clientsPoiService.findAllDepots();
  }

  /** Liste uniquement les magasins clients (table clients). */
  @Get('clients')
  listClients() {
    return this.clientsPoiService.findAllClients();
  }

  /** Création unitaire (saisie écran « Ajouter POIs »). */
  @Post()
  create(@Body() body: UpsertClientPoiBody) {
    return this.clientsPoiService.create(body);
  }

  /** Mise à jour par code client (URL-encoded si besoin). */
  @Put(':code')
  update(@Param('code') code: string, @Body() body: UpsertClientPoiBody) {
    return this.clientsPoiService.update(decodeURIComponent(code), body);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.clientsPoiService.remove(decodeURIComponent(code));
  }

  /** Corps JSON : `{ "originCode": "<SITCODE>", "clientCodes": ["A","B"] }` — distances en km, clés majuscules. */
  @Post('theoretical-km')
  theoreticalKm(
    @Body()
    body: {
      originCode?: string;
      clientCodes?: string[];
    },
  ) {
    const originCode = String(body?.originCode ?? '').trim();
    const clientCodes = Array.isArray(body?.clientCodes) ? body.clientCodes : [];
    return this.clientsPoiService.theoreticalKmBatch(originCode, clientCodes).then((distances) => ({
      distances,
    }));
  }

  /** Une entrée par ligne : **aller-retour dépôt→client→dépôt** (km total, ex. 33,74 + 35,57 ≈ 69,31). */
  @Post('theoretical-km-legs')
  theoreticalKmLegs(
    @Body()
    body: {
      originCode?: string;
      clientCodes?: string[];
    },
  ) {
    const originCode = String(body?.originCode ?? '').trim();
    const clientCodes = Array.isArray(body?.clientCodes) ? body.clientCodes : [];
    return this.clientsPoiService.theoreticalKmLegsAlongTour(originCode, clientCodes).then((legKms) => ({
      legKms,
    }));
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importExcel(@UploadedFile() file: { buffer: Buffer } | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier manquant (champ multipart : file)');
    }
    return this.clientsPoiService.importExcel(file.buffer);
  }
}
