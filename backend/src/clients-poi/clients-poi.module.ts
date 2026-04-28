import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsPoiController } from './clients-poi.controller';
import { ClientsPoiService } from './clients-poi.service';
import { ClientPoi } from './entities/client-poi.entity';
import { Depot } from './entities/depot.entity';
import { ClientPoint } from './entities/client-point.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientPoi, Depot, ClientPoint])],
  controllers: [ClientsPoiController],
  providers: [ClientsPoiService],
  exports: [ClientsPoiService],
})
export class ClientsPoiModule {}
