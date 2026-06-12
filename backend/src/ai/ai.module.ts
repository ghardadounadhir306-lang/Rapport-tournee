import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { RouteOptimizerService } from './route-optimizer.service';
import { AnomalyAnalyzerService } from './anomaly-analyzer.service';
import { ChatbotService } from './chatbot.service';
import { PredictionService } from './prediction.service';
import { AiController } from './ai.controller';
import { Depot } from '../clients-poi/entities/depot.entity';
import { ClientPoint } from '../clients-poi/entities/client-point.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Depot, ClientPoint]),
    MailModule,
  ],
  controllers: [AiController],
  providers: [
    GeminiService,
    RouteOptimizerService,
    AnomalyAnalyzerService,
    ChatbotService,
    PredictionService,
  ],
  exports: [GeminiService],
})
export class AiModule {}
