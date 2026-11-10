import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { products } from './catalog';
import { coupons } from './coupons';
import { actorType, orderStatus, paymentMethod } from './enums';
import { createdAt, fk, pk, publicId, updatedAt, vnd } from './helpers';
import { users } from './users';

/** Snapshot địa chỉ tại thời điểm đặt hàng (ORD-02). Key snake_case như API. */
export type ShippingAddressSnapshot = {
  recipient_name: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  province: string;
};

// ─── orders ─────────────────────────────────────────────────────────────
export const orders = pgTable(
  'orders',
  {
    id: pk(),
    publicId: publicId(),
    orderNumber: varchar('order_number', { length: 24 }).notNull(), // ORD-YYYYMMDD-XXXXXX
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: orderStatus('status').notNull().default('pending'),
    subtotalVnd: vnd('subtotal_vnd').notNull(),
    discountVnd: vnd('discount_vnd').notNull().default(0),
    shippingFeeVnd: vnd('shipping_fee_vnd').notNull().default(0),
    totalVnd: vnd('total_vnd').notNull(),
    couponId: fk('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
    shippingAddress: jsonb('shipping_address').$type<ShippingAddressSnapshot>().notNull(),
    paymentMethod: paymentMethod('payment_method').notNull(),
    note: text('note'),
    cancelledReason: text('cancelled_reason'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('orders_order_number_uq').on(t.orderNumber),
    index('orders_user_created_idx').on(t.userId, t.createdAt.desc()),
    index('orders_status_created_idx').on(t.status, t.createdAt),
    check(
      'orders_amounts_nonneg_ck',
      sql`${t.subtotalVnd} >= 0 AND ${t.discountVnd} >= 0 AND ${t.shippingFeeVnd} >= 0 AND ${t.totalVnd} >= 0`,
    ),
    // ORD-04: total = subtotal − discount + shipping
    check(
      'orders_total_consistent_ck',
      sql`${t.totalVnd} = ${t.subtotalVnd} - ${t.discountVnd} + ${t.shippingFeeVnd}`,
    ),
  ],
);

// ─── order_items ────────────────────────────────────────────────────────
export const orderItems = pgTable(
  'order_items',
  {
    id: pk(),
    orderId: fk('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    // restrict: sản phẩm đã có trong đơn không bao giờ bị xoá cứng (CAT-07)
    productId: fk('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    productName: varchar('product_name', { length: 255 }).notNull(), // snapshot
    unitPriceVnd: vnd('unit_price_vnd').notNull(), // snapshot
    quantity: integer('quantity').notNull(),
    lineTotalVnd: vnd('line_total_vnd').notNull(),
  },
  (t) => [
    index('order_items_order_id_idx').on(t.orderId),
    index('order_items_product_id_idx').on(t.productId),
    check('order_items_quantity_positive_ck', sql`${t.quantity} > 0`),
    check('order_items_line_total_ck', sql`${t.lineTotalVnd} = ${t.unitPriceVnd} * ${t.quantity}`),
  ],
);

// ─── order_status_history ───────────────────────────────────────────────
export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: pk(),
    orderId: fk('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: orderStatus('from_status'), // null khi đơn mới tạo
    toStatus: orderStatus('to_status').notNull(),
    actorType: actorType('actor_type').notNull(),
    actorId: fk('actor_id').references(() => users.id, { onDelete: 'set null' }), // null khi system
    note: text('note'),
    createdAt: createdAt(),
  },
  (t) => [index('order_status_history_order_id_idx').on(t.orderId)],
);
