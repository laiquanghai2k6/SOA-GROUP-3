import { bigint, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Khoá chính nội bộ: bigint generated always as identity (SRS 5.1). Không lộ ra API. */
export const pk = () => bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity();

/** UUID dùng trong URL/response (SRS 3.2). */
export const publicId = () => uuid('public_id').notNull().unique().defaultRandom();

/** Cột khoá ngoại bigint (tự thêm .notNull()/.references() ở nơi dùng). */
export const fk = (name: string) => bigint(name, { mode: 'number' });

/** Tiền VND: số nguyên, hậu tố _vnd (SRS 3.2). */
export const vnd = (name: string) => bigint(name, { mode: 'number' });

export const tstz = (name: string) => timestamp(name, { withTimezone: true });

export const createdAt = () => tstz('created_at').notNull().defaultNow();

export const updatedAt = () =>
  tstz('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
