export interface ProblemDefinition {
  status: number;
  title: string;
}

/** Danh mục lỗi chuẩn (SRS mục 3.5). Hai slug cuối là bổ sung ngoài SRS. */
export const PROBLEMS = {
  'invalid-json': { status: 400, title: 'JSON không hợp lệ' },
  'missing-idempotency-key': { status: 400, title: 'Thiếu header Idempotency-Key' },
  unauthenticated: { status: 401, title: 'Chưa xác thực' },
  'invalid-credentials': { status: 401, title: 'Email hoặc mật khẩu không đúng' },
  forbidden: { status: 403, title: 'Không đủ quyền truy cập' },
  'not-found': { status: 404, title: 'Không tìm thấy tài nguyên' },
  'email-already-exists': { status: 409, title: 'Email đã được đăng ký' },
  'out-of-stock': { status: 409, title: 'Sản phẩm không đủ tồn kho' },
  'invalid-state-transition': { status: 409, title: 'Chuyển trạng thái không hợp lệ' },
  conflict: { status: 409, title: 'Xung đột dữ liệu' },
  'validation-error': { status: 422, title: 'Dữ liệu không hợp lệ' },
  'coupon-invalid': { status: 422, title: 'Mã giảm giá không dùng được' },
  'idempotency-key-reuse': { status: 422, title: 'Idempotency-Key đã dùng với nội dung khác' },
  'rate-limited': { status: 429, title: 'Vượt giới hạn request' },
  'internal-error': { status: 500, title: 'Lỗi hệ thống' },
  'payload-too-large': { status: 413, title: 'Body vượt quá 100 KB' },
  'service-unavailable': { status: 503, title: 'Dịch vụ chưa sẵn sàng' },
} as const satisfies Record<string, ProblemDefinition>;

export type ProblemSlug = keyof typeof PROBLEMS;
