import { Injectable, type LoggerService } from '@nestjs/common';
import { pino, stdTimeFunctions, type Logger } from 'pino';
import { AppConfig } from '../../config/app-config';
import { getRequestId } from '../context/request-context';

type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/** Không bao giờ log các giá trị này (PLT-05, NFR-SEC-01). */
const REDACT_PATHS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'card_number',
  'cvv',
  '*.password',
  '*.token',
  '*.access_token',
  '*.refresh_token',
  '*.authorization',
  '*.cookie',
  '*.card_number',
  '*.cvv',
  'req.headers.authorization',
  'req.headers.cookie',
];

/** Logger JSON có cấu trúc, đồng thời là logger của NestJS. */
@Injectable()
export class AppLogger implements LoggerService {
  readonly pino: Logger;

  constructor(config: AppConfig) {
    this.pino = pino({
      level: config.env.LOG_LEVEL,
      base: undefined,
      timestamp: stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
      redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
      mixin: () => {
        const requestId = getRequestId();
        return requestId ? { request_id: requestId } : {};
      },
    });
  }

  log(message: unknown, ...params: unknown[]): void {
    this.write('info', message, params);
  }
  error(message: unknown, ...params: unknown[]): void {
    this.write('error', message, params);
  }
  warn(message: unknown, ...params: unknown[]): void {
    this.write('warn', message, params);
  }
  debug(message: unknown, ...params: unknown[]): void {
    this.write('debug', message, params);
  }
  verbose(message: unknown, ...params: unknown[]): void {
    this.write('trace', message, params);
  }
  fatal(message: unknown, ...params: unknown[]): void {
    this.write('fatal', message, params);
  }

  private write(level: Level, message: unknown, params: unknown[]): void {
    let context: string | undefined;
    let stack: string | undefined;
    for (const param of params) {
      if (typeof param !== 'string') continue;
      if (param.includes('\n    at ')) stack = param;
      else context = param;
    }
    const bindings = { ...(context ? { context } : {}), ...(stack ? { stack } : {}) };

    if (message instanceof Error) {
      this.pino[level]({ ...bindings, err: message }, message.message);
    } else if (typeof message === 'object' && message !== null) {
      this.pino[level]({ ...bindings, ...message });
    } else {
      this.pino[level](bindings, String(message));
    }
  }
}
