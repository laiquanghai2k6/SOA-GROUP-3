import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
  type SwaggerDocumentOptions,
} from '@nestjs/swagger';
import type { ZodType } from 'zod';
import { createSchema } from 'zod-openapi';

/** Standard Schema lưu tên thư viện ở `~standard.vendor`, dùng để nhận ra schema zod. */
function isZodSchema(schema: unknown): schema is ZodType {
  return (
    !!schema &&
    typeof schema === 'object' &&
    (schema as { '~standard'?: { vendor?: string } })['~standard']?.vendor === 'zod'
  );
}

/** Dựng tài liệu OpenAPI 3.1 từ controller + schema zod. Phải gọi SAU setGlobalPrefix. */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Shop API')
    .setDescription(
      'Backend REST API hệ thống thương mại điện tử. ' +
        'Xác thực chỉ bằng cookie HttpOnly (access_token, refresh_token); lỗi theo RFC 9457 (application/problem+json).',
    )
    .setVersion('1.0.0')
    .setOpenAPIVersion('3.1.0')
    .addCookieAuth(
      'access_token',
      { type: 'apiKey', in: 'cookie', name: 'access_token' },
      'access_token',
    )
    .build();

  const options: SwaggerDocumentOptions = {
    standardSchemaConverter: (schema, { schemaType }) => {
      if (isZodSchema(schema)) {
        const { schema: converted, components } = createSchema(schema, {
          io: schemaType,
          openapiVersion: '3.1.0',
        });
        return { schema: converted, components };
      }
    },
  };

  return SwaggerModule.createDocument(app, config, options);
}

/** Swagger UI tại /docs, JSON tại /openapi.json (PLT-07). Không dùng global prefix. */
export function setupOpenApi(app: INestApplication, document: OpenAPIObject): void {
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',
    customSiteTitle: 'Shop API - Docs',
  });
}
