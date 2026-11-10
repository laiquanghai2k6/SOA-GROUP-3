import type { NextFunction, Request, Response } from 'express';
import type { AppLogger } from './app-logger';

const QUIET_PATHS = new Set(['/healthz', '/ready']);

/** Mỗi request một dòng log: request_id, method, path, status, latency_ms (PLT-05). */
export function createHttpLoggerMiddleware(logger: AppLogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    res.once('close', () => {
      const path = req.originalUrl.split('?')[0] ?? req.originalUrl;
      const status = res.statusCode;
      const latencyMs = Math.round((Number(process.hrtime.bigint() - startedAt) / 1e6) * 100) / 100;
      const level =
        QUIET_PATHS.has(path) && status < 400
          ? 'debug'
          : status >= 500
            ? 'error'
            : status >= 400
              ? 'warn'
              : 'info';

      logger.pino[level](
        {
          request_id: String(res.locals.requestId),
          method: req.method,
          path,
          status,
          latency_ms: latencyMs,
          ...(res.writableFinished ? {} : { aborted: true }),
        },
        'request completed',
      );
    });

    next();
  };
}
