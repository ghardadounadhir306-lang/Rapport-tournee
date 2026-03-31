import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsPoint } from './entities/gps-point.entity';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';

@Module({
  imports: [TypeOrmModule.forFeature([GpsPoint])],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}
