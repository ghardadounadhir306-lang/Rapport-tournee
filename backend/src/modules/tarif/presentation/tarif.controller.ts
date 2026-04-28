import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TarifService } from '../application/tarif.service';
import { CalculateTarifDto } from './dto/calculate-tarif.dto';

@ApiTags('Tarif')
@Controller('api/tarif')
export class TarifController {
    constructor(private readonly tarifService: TarifService) { }

    @Get('stores')
    @ApiOperation({ summary: 'Get list of Aziza stores' })
    @ApiResponse({ status: 200, description: 'Stores successfully retrieved' })
    getStores() {
        return this.tarifService.getStores();
    }

    @Post('calculate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Calculate tarif based on distance, palettes, and stores' })
    @ApiResponse({ status: 200, description: 'Pricing successfully calculated' })
    @ApiResponse({ status: 400, description: 'Missing required parameters or Sector mismatch' })
    @ApiResponse({ status: 404, description: 'No matching tarif row found' })
    calculate(@Body() dto: CalculateTarifDto) {
        return this.tarifService.calculateTarif(dto);
    }
}
