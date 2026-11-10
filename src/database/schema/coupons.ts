import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { couponType } from './enums';
import { createdAt, pk, publicId, tstz, updatedAt, vnd } from './helpers';

export const coupons = pgTable(
  'coupons',
  {
    id: pk(),
    publicId: publicId(),
    code: varchar('code', { length: 50 }).notNull(), // luôn in hoa
    type: couponType('type').notNull(),
    value: vnd('value').notNull(), // percent: 1–100; fixed: số VND
    minOrderVnd: vnd('min_order_vnd').notNull().default(0),
    maxDiscountVnd: vnd('max_discount_vnd'), // chỉ dùng cho percent
    usageLimit: integer('usage_limit'), // null = không giới hạn
    usedCount: integer('used_count').notNull().default(0),
    startsAt: tstz('starts_at'),
    endsAt: tstz('ends_at'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('coupons_code_uq').on(t.code),
    check('coupons_code_uppercase_ck', sql`${t.code} = upper(${t.code})`),
    check('coupons_value_positive_ck', sql`${t.value} > 0`),
    check('coupons_percent_range_ck', sql`${t.type} <> 'percent' OR ${t.value} BETWEEN 1 AND 100`),
    check('coupons_used_count_ck', sql`${t.usedCount} >= 0`),
    check(
      'coupons_period_ck',
      sql`${t.startsAt} IS NULL OR ${t.endsAt} IS NULL OR ${t.endsAt} > ${t.startsAt}`,
    ),
  ],
);
