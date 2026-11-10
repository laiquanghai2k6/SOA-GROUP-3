import { sql } from 'drizzle-orm';
import { check, integer, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { products } from './catalog';
import { fk, pk, updatedAt } from './helpers';
import { users } from './users';

export const carts = pgTable(
  'carts',
  {
    id: pk(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('carts_user_id_uq').on(t.userId)], // đúng một giỏ / customer
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: pk(),
    cartId: fk('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: fk('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
  },
  (t) => [
    uniqueIndex('cart_items_cart_product_uq').on(t.cartId, t.productId),
    check('cart_items_quantity_range_ck', sql`${t.quantity} BETWEEN 1 AND 99`),
  ],
);
