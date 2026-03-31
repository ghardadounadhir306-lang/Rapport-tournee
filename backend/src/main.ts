import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as net from 'net';

/** Kill any process currently listening on a port (Windows & Unix). */
function freePort(port: number): Promise<void> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.listen(port, '0.0.0.0', () => {
      // Port is free — close probe and continue
      probe.close(() => resolve());
    });
    probe.on('error', () => {
      // Port is in use — try to close it via child_process
      const { execSync } = require('child_process');
      try {
        if (process.platform === 'win32') {
          const out = execSync(
            `netstat -ano | findstr ":${port} " | findstr "LISTENING"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] },
          );
          const pid = out.trim().split(/\s+/).pop();
          if (pid && /^\d+$/.test(pid) && pid !== '0') {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`[bootstrap] Freed port ${port} (killed PID ${pid})`);
          }
        } else {
          execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
          console.log(`[bootstrap] Freed port ${port}`);
        }
      } catch {
        // ignore — may already be freed by the time we get here
      }
      // Small delay so the OS reclaims the port
      setTimeout(resolve, 500);
    });
  });
}

async function bootstrap() {
  const port = Number(process.env.PORT ?? 3001);

  // Release port if occupied by a stale process from a previous run
  await freePort(port);

  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('R.Tournee API')
    .setDescription('The clean architecture API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
