import type { Request } from 'express';

/** Giá trị header Location cho 201: <đường dẫn collection>/<public_id>. */
export function resourceLocation(req: Request, publicId: string): string {
  const base = (req.originalUrl.split('?')[0] ?? req.originalUrl).replace(/\/+$/, '');
  return `${base}/${publicId}`;
}
