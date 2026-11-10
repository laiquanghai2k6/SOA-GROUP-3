import { index, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { coupons } from './coupons';
import { createdAt, fk, pk } from './helpers';
import { orders } from './orders';
import { users } from './users';

// Tách file riêng để tránh import vòng giữa coupons.ts và orders.ts.
export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    id: pk(),
    couponId: fk('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'restrict' }),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orderId: fk('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [
    // CPN-04: mỗi user dùng một mã tối đa 1 lần
    uniqueIndex('coupon_redemptions_coupon_user_uq').on(t.couponId, t.userId),
    index('coupon_redemptions_order_id_idx').on(t.orderId),
  ],
);
