import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TmsFormData } from '../tms/entities/tms-form-data.entity';
import { AnomalyEvaluationService } from './anomaly-evaluation.service';
import { AnomaliesController } from './anomalies.controller';
import { AnomaliesService } from './anomalies.service';
import { Anomaly } from './entities/anomaly.entity';
import { AnomalyType } from './entities/anomaly-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Anomaly, AnomalyType, TmsFormData])],
  controllers: [AnomaliesController],
  providers: [AnomalyEvaluationService, AnomaliesService],
  exports: [AnomalyEvaluationService, AnomaliesService, TypeOrmModule],
})
export class AnomaliesModule {}
