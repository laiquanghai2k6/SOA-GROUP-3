import { type CanActivate, type ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppConfig } from '../../config/app-config';
import { ProblemException } from '../errors/problem.exception';

export const SKIP_ORIGIN_CHECK = 'skipOriginCheck';

/** Miễn kiểm tra Origin cho endpoint do hệ thống bên ngoài gọi (ví dụ webhook thanh toán). */
export const SkipOriginCheck = () => SetMetadata(SKIP_ORIGIN_CHECK, true);

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Chống CSRF (AUTH-10): request đổi trạng thái phải có Origin (hoặc Referer) thuộc CORS_ORIGINS.
 * Postman và test tích hợp phải gửi kèm header Origin.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowed: ReadonlySet<string>;

  constructor(
    config: AppConfig,
    private readonly reflector: Reflector,
  ) {
    this.allowed = new Set(config.env.CORS_ORIGINS);
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!UNSAFE_METHODS.has(req.method)) return true;

    const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_ORIGIN_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const origin = this.extractOrigin(req);
    if (origin && this.allowed.has(origin)) return true;

    throw new ProblemException('forbidden', 'Origin của request không được phép.');
  }

  private extractOrigin(req: Request): string | undefined {
    const origin = req.header('origin');
    if (origin) return origin;

    const referer = req.header('referer');
    if (!referer) return undefined;
    try {
      return new URL(referer).origin;
    } catch {
      return undefined;
    }
  }
}
