import { createApp } from './app.setup';
import { AppLogger } from './common/logging/app-logger';
import { EnvValidationError, loadEnv } from './config/env.schema';

async function bootstrap(): Promise<void> {
  const env = loadEnv(); // thiếu/sai biến môi trường thì dừng ngay (PLT-01)
  const app = await createApp();
  await app.listen(env.PORT, '0.0.0.0');
  app
    .get(AppLogger)
    .log(`API sẵn sàng tại cổng ${env.PORT} (docs: /docs, openapi: /openapi.json)`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof EnvValidationError ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  if (!(error instanceof EnvValidationError) && error instanceof Error && error.stack) {
    process.stderr.write(`${error.stack}\n`);
  }
  process.exit(1);
});
