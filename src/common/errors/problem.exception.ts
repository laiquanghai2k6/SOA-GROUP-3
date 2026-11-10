import { HttpException } from '@nestjs/common';
import { PROBLEMS, type ProblemSlug } from './problem-catalog';

export interface FieldError {
  field: string;
  message: string;
}

export interface ProblemMeta {
  /** Ghi đè title mặc định của slug. */
  title?: string;
  /** Chỉ dùng cho validation-error (422). */
  errors?: FieldError[];
  /** Trường mở rộng của problem+json, ví dụ { reason: 'expired' } cho coupon-invalid. Không đặt trùng tên trường chuẩn. */
  extensions?: Record<string, unknown>;
  /** Header thêm vào response, ví dụ Retry-After. */
  headers?: Record<string, string>;
}

/**
 * Ném lỗi nghiệp vụ theo danh mục SRS 3.5:
 *   throw new ProblemException('out-of-stock', "Sản phẩm 'Áo thun' chỉ còn 2, yêu cầu 5.");
 */
export class ProblemException extends HttpException {
  readonly slug: ProblemSlug;
  readonly detail?: string;
  readonly meta: ProblemMeta;

  constructor(slug: ProblemSlug, detail?: string, meta: ProblemMeta = {}) {
    super({ slug, detail }, PROBLEMS[slug].status);
    this.name = 'ProblemException';
    this.slug = slug;
    this.detail = detail;
    this.meta = meta;
  }

  static notFound(detail?: string): ProblemException {
    return new ProblemException('not-found', detail);
  }

  static conflict(detail?: string): ProblemException {
    return new ProblemException('conflict', detail);
  }

  static forbidden(detail?: string): ProblemException {
    return new ProblemException('forbidden', detail);
  }

  static validation(
    errors: FieldError[],
    detail = 'Dữ liệu đầu vào không hợp lệ.',
  ): ProblemException {
    return new ProblemException('validation-error', detail, { errors });
  }
}
