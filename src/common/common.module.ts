import {
  Global,
  HttpStatus,
  Module,
  StandardSchemaValidationPipe,
  StandardSchemaSerializerInterceptor,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from '../config/app-config';
import { ProblemDetailsFilter } from './errors/problem-details.filter';
import { ProblemException } from './errors/problem.exception';
import { CacheControlInterceptor } from './http/cache-control';
import { AppLogger } from './logging/app-logger';
import { OriginGuard } from './security/origin.guard';
import { DEFAULT_RATE_LIMIT, RateLimitGuard } from './security/rate-limit.guard';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        throttlers: [{ ...DEFAULT_RATE_LIMIT }],
        skipIf: () => !config.env.RATE_LIMIT_ENABLED,
      }),
    }),
  ],
  providers: [
    AppLogger,
    // NestJS 12 dùng Standard Schema native; Zod 4 tương thích trực tiếp.
    {
      provide: APP_PIPE,
      useFactory: () =>
        new StandardSchemaValidationPipe({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          exceptionFactory: (issues) =>
            ProblemException.validation(
              issues.map((issue) => ({
                field:
                  issue.path
                    ?.map((segment) =>
                      typeof segment === 'object' && segment !== null && 'key' in segment
                        ? String(segment.key)
                        : String(segment),
                    )
                    .join('.') || '$',
                message: issue.message,
              })),
            ),
        }),
    },
    { provide: APP_INTERCEPTOR, useClass: StandardSchemaSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheControlInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    // Thứ tự guard: rate limit -> kiểm tra Origin. JwtAuthGuard/RolesGuard (M1) đăng ký sau.
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: OriginGuard },
  ],
  exports: [AppLogger],
})
export class CommonModule {}
