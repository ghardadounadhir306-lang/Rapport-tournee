import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private model: GenerativeModel | null = null;
  private lastCallTime = 0;

  constructor(private readonly config: ConfigService) { }

  onModuleInit() {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (!key) {
      this.logger.warn('GEMINI_API_KEY not configured — AI features disabled.');
      return;
    }
    const genAI = new GoogleGenerativeAI(key);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.logger.log('Gemini AI model initialized (gemini-2.5-flash)');
  }

  isReady(): boolean {
    return this.model !== null;
  }

  /**
   * Send a prompt to Gemini and return the text response.
   * Includes retry logic, rate-limit handling, and request spacing.
   */
  async generate(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured. Set GEMINI_API_KEY in .env');
    }

    // Space requests at least 4s apart to avoid rate limiting on free tier
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < 4000) {
      await new Promise((r) => setTimeout(r, 4000 - elapsed));
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.lastCallTime = Date.now();
        
        // Create a timeout controller for this request (10 second timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);
        
        try {
          const result = await this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: systemInstruction
              ? { role: 'user', parts: [{ text: systemInstruction }] }
              : undefined,
          });
          clearTimeout(timeoutId);
          return result.response.text();
        } catch (innerErr: any) {
          clearTimeout(timeoutId);
          throw innerErr;
        }
      } catch (err: any) {
        const status = err?.status ?? err?.httpStatusCode ?? 0;
        const msg = err?.message ?? String(err);

        if ((status === 429 || msg.includes('429') || msg.includes('quota')) && attempt < maxRetries) {
          // Parse retry delay from error if available, otherwise exponential backoff
          const waitMs = Math.min(60_000, 10_000 * (attempt + 1));
          this.logger.warn(`Gemini rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${waitMs / 1000}s...`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        const isTimeout = msg.includes('AbortError') || msg.includes('timeout');
        const logMsg = isTimeout
          ? `Gemini request timeout (10s) on attempt ${attempt + 1}/${maxRetries}`
          : `Gemini generation failed: ${msg}`;

        this.logger.error(logMsg);

        if (isTimeout && attempt < maxRetries) {
          this.logger.warn(`Retrying after timeout...`);
          continue;
        }

        throw new Error(
          status === 429 || msg.includes('429')
            ? 'Quota Gemini épuisé. Veuillez patienter quelques minutes avant de réessayer.'
            : isTimeout
              ? 'Gemini API timeout. Veuillez réessayer.'
              : `Erreur Gemini: ${msg}`,
        );
      }
    }
    throw new Error('Gemini generation failed after retries');
  }

  /**
   * Generate with JSON output — parses the response as JSON.
   */
  async generateJSON<T = any>(prompt: string, systemInstruction?: string): Promise<T> {
    const raw = await this.generate(prompt, systemInstruction);
    // Gemini sometimes wraps JSON in ```json ... ``` markdown blocks
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      this.logger.warn('Failed to parse Gemini JSON, raw output: ' + raw.slice(0, 200));
      throw new Error('Réponse IA invalide. Veuillez réessayer.');
    }
  }
}
