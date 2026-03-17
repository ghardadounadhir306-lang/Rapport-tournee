import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TmsModule } from './tms/tms.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [TmsModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
