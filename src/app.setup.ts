import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { rebindRequestContext, requestIdMiddleware } from './common/context/request-id.middleware';
import { AppLogger } from './common/logging/app-logger';
import { createHttpLoggerMiddleware } from './common/logging/http-logger.middleware';
import { securityHeaders } from './common/security/security-headers';
import { AppConfig } from './config/app-config';
import { buildOpenApiDocument, setupOpenApi } from './openapi/openapi';

export const API_PREFIX = 'api/v1';

/** Cấu hình dùng chung cho main.ts, script export OpenAPI và test e2e. */
export function configureApp(app: NestExpressApplication): void {
  const { env } = app.get(AppConfig);
  const logger = app.get(AppLogger);

  app.useLogger(logger);
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  // Thứ tự quan trọng: request id và log đứng đầu để cả lỗi parse body/preflight đều có trace_id
  app.use(requestIdMiddleware);
  app.use(createHttpLoggerMiddleware(logger));
  app.use(securityHeaders);

  // CORS có credentials, origin cụ thể từ allowlist, không dùng * (AUTH-11)
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key', 'If-None-Match', 'X-Request-Id'],
    exposedHeaders: [
      'Location',
      'ETag',
      'Retry-After',
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'Idempotent-Replayed',
      'X-Request-Id',
    ],
    maxAge: 600,
  });

  app.use(cookieParser());
  app.useBodyParser('json', { limit: '100kb' }); // NFR-SEC-04
  app.use(rebindRequestContext);

  app.setGlobalPrefix(API_PREFIX, { exclude: ['healthz', 'ready'] });
  app.enableShutdownHooks(); // SIGTERM: đóng HTTP server rồi đóng pool DB (PLT-11)

  setupOpenApi(app, buildOpenApiDocument(app));
}

export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // body parser được đăng ký thủ công trong configureApp
    bufferLogs: true,
  });
  configureApp(app);
  return app;
}
