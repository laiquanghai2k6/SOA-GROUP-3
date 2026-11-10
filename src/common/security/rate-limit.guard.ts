import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Throttle, ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';
import { ProblemException } from '../errors/problem.exception';

/** Mặc định 100 request/phút/IP (SRS 3.8). */
export const DEFAULT_RATE_LIMIT = { ttl: 60_000, limit: 100 } as const;

/** POST /auth/login và POST /auth/register: 5 request/phút/IP. Dùng: @AuthRateLimit() */
export const AuthRateLimit = () => Throttle({ default: { ttl: 60_000, limit: 5 } });

/** Khi bị chặn: 429 problem+json kèm Retry-After, RateLimit-Limit, RateLimit-Remaining. */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    _context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const retryAfter = Math.max(
      1,
      Math.ceil(detail.isBlocked ? detail.timeToBlockExpire : detail.timeToExpire),
    );
    return Promise.reject(
      new ProblemException('rate-limited', `Thử lại sau ${retryAfter} giây.`, {
        headers: {
          'Retry-After': String(retryAfter),
          'RateLimit-Limit': String(detail.limit),
          'RateLimit-Remaining': '0',
        },
      }),
    );
  }
}
