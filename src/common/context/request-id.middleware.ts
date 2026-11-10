import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from './request-context';

export const REQUEST_ID_HEADER = 'X-Request-Id';
const VALID_REQUEST_ID = /^[\w.-]{8,128}$/;

/** Chạy đầu tiên (PLT-04): nhận X-Request-Id hợp lệ hoặc tự sinh UUID, trả lại qua response header. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  runWithRequestContext({ requestId }, next);
}

/** Chạy sau body parser: stream của body-parser có thể làm mất AsyncLocalStorage nên gắn lại. */
export function rebindRequestContext(_req: Request, res: Response, next: NextFunction): void {
  runWithRequestContext({ requestId: String(res.locals.requestId) }, next);
}
