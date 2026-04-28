import { Module } from '@nestjs/common';
import { TarifController } from './presentation/tarif.controller';
import { TarifService } from './application/tarif.service';

@Module({
  controllers: [TarifController],
  providers: [TarifService]
})
export class TarifModule {}
