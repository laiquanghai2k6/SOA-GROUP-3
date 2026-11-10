import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { products } from './catalog';
import { createdAt, fk, pk, publicId, updatedAt } from './helpers';
import { users } from './users';

export const reviews = pgTable(
  'reviews',
  {
    id: pk(),
    publicId: publicId(),
    productId: fk('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // REV-02: mỗi user một đánh giá cho mỗi sản phẩm
    uniqueIndex('reviews_product_user_uq').on(t.productId, t.userId),
    check('reviews_rating_range_ck', sql`${t.rating} BETWEEN 1 AND 5`),
    check('reviews_comment_length_ck', sql`char_length(${t.comment}) <= 1000`),
  ],
);
