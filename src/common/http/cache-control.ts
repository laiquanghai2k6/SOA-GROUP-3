import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';

export const CACHE_CONTROL_KEY = 'cacheControl';

/** Mặc định cho mọi response thành công (dữ liệu cá nhân: /users/me, /cart, /orders). */
export const NO_STORE = 'private, no-store';

export const CacheControl = (value: string) => SetMetadata(CACHE_CONTROL_KEY, value);

/** SRS 3.9: GET /products/{id}, GET /categories -> @PublicCache(30). ETag/304 do Express tự xử lý. */
export const PublicCache = (maxAgeSeconds: number) =>
  CacheControl(`public, max-age=${maxAgeSeconds}`);

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const res = context.switchToHttp().getResponse<Response>();
    const value =
      this.reflector.getAllAndOverride<string | undefined>(CACHE_CONTROL_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? NO_STORE;

    // Đặt sau khi handler thành công để response lỗi không bị cache công khai
    return next.handle().pipe(
      tap(() => {
        if (!res.hasHeader('Cache-Control')) res.setHeader('Cache-Control', value);
      }),
    );
  }
}
