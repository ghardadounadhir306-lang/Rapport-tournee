"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const net = __importStar(require("net"));
function freePort(port) {
    return new Promise((resolve) => {
        const probe = net.createServer();
        probe.listen(port, '0.0.0.0', () => {
            probe.close(() => resolve());
        });
        probe.on('error', () => {
            const { execSync } = require('child_process');
            try {
                if (process.platform === 'win32') {
                    const out = execSync(`netstat -ano | findstr ":${port} " | findstr "LISTENING"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                    const pid = out.trim().split(/\s+/).pop();
                    if (pid && /^\d+$/.test(pid) && pid !== '0') {
                        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                        console.log(`[bootstrap] Freed port ${port} (killed PID ${pid})`);
                    }
                }
                else {
                    execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
                    console.log(`[bootstrap] Freed port ${port}`);
                }
            }
            catch {
            }
            setTimeout(resolve, 500);
        });
    });
}
async function bootstrap() {
    const port = Number(process.env.PORT ?? 3001);
    await freePort(port);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const config = new swagger_1.DocumentBuilder()
        .setTitle('R.Tournee API')
        .setDescription('The clean architecture API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map