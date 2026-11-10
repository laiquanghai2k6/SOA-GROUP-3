import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['customer', 'admin']);
export const userStatus = pgEnum('user_status', ['active', 'blocked']);

export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived']);

export const inventoryRefType = pgEnum('inventory_ref_type', ['order', 'adjustment']);

export const couponType = pgEnum('coupon_type', ['percent', 'fixed']);

export const orderStatus = pgEnum('order_status', [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);
export const actorType = pgEnum('actor_type', ['user', 'admin', 'system']);

export const paymentMethod = pgEnum('payment_method', ['cod', 'mock_card']);
export const paymentStatus = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
]);
