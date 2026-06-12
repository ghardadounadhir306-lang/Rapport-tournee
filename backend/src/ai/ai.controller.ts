import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RouteOptimizerService } from './route-optimizer.service';
import { AnomalyAnalyzerService } from './anomaly-analyzer.service';
import { ChatbotService } from './chatbot.service';
import { PredictionService } from './prediction.service';
import { GeminiService } from './gemini.service';

@ApiTags('ai')
@Controller(['ai', 'api/ai'])
export class AiController {
  constructor(
    private readonly gemini: GeminiService,
    private readonly routeOptimizer: RouteOptimizerService,
    private readonly anomalyAnalyzer: AnomalyAnalyzerService,
    private readonly chatbot: ChatbotService,
    private readonly prediction: PredictionService,
  ) {}

  /** Health check — is Gemini configured? */
  @Get('status')
  getStatus() {
    return {
      geminiReady: this.gemini.isReady(),
      features: ['route-optimizer', 'anomaly-analyzer', 'chatbot', 'predictions'],
    };
  }

  /* ── Route Optimization ──────────────────────────────────────────────── */

  @Post('optimize-route')
  async optimizeRoute(
    @Body() body: { depotCode: string; clientCodes: string[] },
  ) {
    try {
      return await this.routeOptimizer.optimize(body.depotCode, body.clientCodes);
    } catch (err: any) {
      return { error: true, message: err.message || 'Erreur d\'optimisation' };
    }
  }

  /* ── Anomaly Analysis ────────────────────────────────────────────────── */

  @Post('analyze-anomalies')
  async analyzeAnomalies(
    @Body() body: { dateFrom?: string; dateTo?: string },
  ) {
    return this.anomalyAnalyzer.analyzeNonConformites(body.dateFrom, body.dateTo);
  }

  @Post('send-anomaly-report')
  async sendAnomalyReport(
    @Body() body: { dateFrom?: string; dateTo?: string; email?: string },
  ) {
    const analysis = await this.anomalyAnalyzer.analyzeNonConformites(body.dateFrom, body.dateTo);
    const emailResult = await this.anomalyAnalyzer.sendReport(analysis, body.email);
    return { analysis, email: emailResult };
  }

  /* ── Chatbot ─────────────────────────────────────────────────────────── */

  @Post('chat')
  async chat(
    @Body() body: { message: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> },
  ) {
    return this.chatbot.chat(body.message, body.history || []);
  }

  /* ── Predictions ─────────────────────────────────────────────────────── */

  @Get('predictions')
  async getPredictions(
    @Query('tourneeIds') tourneeIds?: string,
  ) {
    const ids = tourneeIds ? tourneeIds.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    return this.prediction.predictDelays(ids);
  }

  @Post('predictions')
  async postPredictions(
    @Body() body: { tourneeIds?: string[] },
  ) {
    return this.prediction.predictDelays(body.tourneeIds);
  }
}
