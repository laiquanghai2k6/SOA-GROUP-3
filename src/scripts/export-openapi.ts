import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApp } from '../app.setup';
import { buildOpenApiDocument } from '../openapi/openapi';

/**
 * Xuất openapi.json ra thư mục gốc để commit (PLT-07). Không kết nối DB (pool chỉ kết nối khi có query).
 * Chạy: npm run openapi:export
 */
async function main(): Promise<void> {
  process.env.LOG_LEVEL = 'silent';
  const app = await createApp();
  try {
    const document = buildOpenApiDocument(app);
    await writeFile(
      resolve(process.cwd(), 'openapi.json'),
      `${JSON.stringify(document, null, 2)}\n`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
