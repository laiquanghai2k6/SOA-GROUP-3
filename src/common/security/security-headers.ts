import type { RequestHandler } from 'express';
import helmet from 'helmet';

const apiHelmet = helmet();

/** Swagger UI cần script/style inline; tắt luôn upgrade-insecure-requests để chạy được trên http://localhost. */
const docsHelmet = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});

/** helmet (NFR-SEC-04): chặt cho API, nới riêng cho /docs. */
export const securityHeaders: RequestHandler = (req, res, next) =>
  (req.path.startsWith('/docs') ? docsHelmet : apiHelmet)(req, res, next);
