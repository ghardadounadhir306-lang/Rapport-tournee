import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseCamionController } from './base-camion.controller';
import { BaseCamionService } from './base-camion.service';
import { BaseCamion } from './entities/base-camion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BaseCamion])],
  controllers: [BaseCamionController],
  providers: [BaseCamionService],
  exports: [BaseCamionService],
})
export class BaseCamionModule {}
