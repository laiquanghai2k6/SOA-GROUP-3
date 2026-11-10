import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfig } from '../../config/app-config';
import { getRequestId } from '../context/request-context';
import { AppLogger } from '../logging/app-logger';
import { PROBLEMS, type ProblemSlug } from './problem-catalog';
import { type FieldError, ProblemException } from './problem.exception';

interface ResolvedProblem {
  slug?: ProblemSlug;
  status: number;
  title: string;
  detail?: string;
  errors?: FieldError[];
  extensions?: Record<string, unknown>;
  headers?: Record<string, string>;
}

const STATUS_TO_SLUG: Partial<Record<number, ProblemSlug>> = {
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  413: 'payload-too-large',
  422: 'validation-error',
  429: 'rate-limited',
  503: 'service-unavailable',
};

type IssuePathSegment = PropertyKey | { key: PropertyKey };

/** ['items', 0, 'quantity'] -> items[0].quantity */
export function formatIssuePath(path: readonly IssuePathSegment[]): string {
  const formatted = path.reduce<string>((acc, segment) => {
    if (typeof segment === 'object' && segment !== null && 'key' in segment) {
      segment = segment.key;
    }
    if (typeof segment === 'number') return `${acc}[${segment}]`;
    return acc ? `${acc}.${String(segment)}` : String(segment);
  }, '');
  return formatted || '$';
}

function extractMessage(exception: HttpException): string | undefined {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.map(String).join('; ');
  return typeof message === 'string' ? message : undefined;
}

/** Mọi lỗi trả application/problem+json theo RFC 9457 (PLT-03, SRS 3.5). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(
    private readonly config: AppConfig,
    private readonly logger: AppLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') throw exception;

    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const problem = this.resolve(exception);
    const traceId = (res.locals.requestId as string | undefined) ?? getRequestId() ?? randomUUID();
    const path = req.originalUrl.split('?')[0] ?? req.originalUrl;

    if (problem.status >= 500) {
      this.logger.pino.error(
        { err: exception, request_id: traceId, method: req.method, path },
        'request failed',
      );
    }
    if (res.headersSent) {
      res.end();
      return;
    }

    const body = {
      type: problem.slug ? `${this.config.env.PROBLEM_BASE_URL}/${problem.slug}` : 'about:blank',
      title: problem.title,
      status: problem.status,
      ...(problem.detail ? { detail: problem.detail } : {}),
      instance: path,
      trace_id: traceId,
      ...(problem.errors ? { errors: problem.errors } : {}),
      ...problem.extensions,
    };

    for (const [name, value] of Object.entries(problem.headers ?? {})) res.setHeader(name, value);
    if (problem.status === 401) res.setHeader('WWW-Authenticate', 'Cookie realm="shop-api"');
    res.setHeader('Cache-Control', 'no-store');
    res.status(problem.status).type('application/problem+json').json(body);
  }

  private resolve(exception: unknown): ResolvedProblem {
    if (exception instanceof ProblemException) {
      const definition = PROBLEMS[exception.slug];
      return {
        slug: exception.slug,
        status: definition.status,
        title: exception.meta.title ?? definition.title,
        detail: exception.detail,
        errors: exception.meta.errors,
        extensions: exception.meta.extensions,
        headers: exception.meta.headers,
      };
    }

    // Lỗi từ body-parser (chạy trước router của Nest)
    const parserType = (exception as { type?: unknown } | null)?.type;
    if (parserType === 'entity.parse.failed') {
      return {
        slug: 'invalid-json',
        status: PROBLEMS['invalid-json'].status,
        title: PROBLEMS['invalid-json'].title,
        detail: 'Body request không phải JSON hợp lệ.',
      };
    }
    if (parserType === 'entity.too.large') {
      return {
        slug: 'payload-too-large',
        status: PROBLEMS['payload-too-large'].status,
        title: PROBLEMS['payload-too-large'].title,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500 && status !== 503) return this.internal();

      // BadRequestException của Nest (ParseUUIDPipe...) là lỗi validation -> 422 theo SRS 3.4
      const slug = status === 400 ? 'validation-error' : STATUS_TO_SLUG[status];
      const detail = extractMessage(exception);
      if (slug) {
        const definition = PROBLEMS[slug];
        return { slug, status: definition.status, title: definition.title, detail };
      }
      return { status, title: STATUS_CODES[status] ?? 'Error', detail };
    }

    return this.internal();
  }

  private internal(): ResolvedProblem {
    const definition = PROBLEMS['internal-error'];
    return { slug: 'internal-error', status: definition.status, title: definition.title };
  }
}
