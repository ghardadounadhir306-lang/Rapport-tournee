import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TransportDataService } from './transport-data.service';
import { TransportData } from './entities/transport-data.entity';

@Controller('api/transport-data')
export class TransportDataController {
  constructor(private readonly service: TransportDataService) {}

  @Post()
  create(@Body() data: Partial<TransportData>) {
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<TransportData>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }
}
