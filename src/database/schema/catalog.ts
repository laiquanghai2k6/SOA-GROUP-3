import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { inventoryRefType, productStatus } from './enums';
import { createdAt, fk, pk, publicId, updatedAt, vnd } from './helpers';
import { users } from './users';

// ─── categories ─────────────────────────────────────────────────────────
export const categories = pgTable(
  'categories',
  {
    id: pk(),
    publicId: publicId(),
    // restrict: xoá danh mục còn danh mục con → lỗi → service trả 409 (CAT-02)
    parentId: fk('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'restrict',
    }),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('categories_slug_uq').on(t.slug),
    index('categories_parent_id_idx').on(t.parentId),
  ],
);

// ─── products ───────────────────────────────────────────────────────────
export const products = pgTable(
  'products',
  {
    id: pk(),
    publicId: publicId(),
    categoryId: fk('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 280 }).notNull(),
    sku: varchar('sku', { length: 64 }).notNull(),
    description: text('description'),
    priceVnd: vnd('price_vnd').notNull(),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    status: productStatus('status').notNull().default('draft'),
    // REV-04: cập nhật trong cùng transaction với review
    avgRating: numeric('avg_rating', { precision: 2, scale: 1, mode: 'number' })
      .notNull()
      .default(0),
    reviewCount: integer('review_count').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('products_sku_uq').on(t.sku),
    uniqueIndex('products_slug_uq').on(t.slug),
    check('products_price_positive_ck', sql`${t.priceVnd} > 0`),
    check('products_stock_nonneg_ck', sql`${t.stockQuantity} >= 0`),
    index('products_category_status_idx').on(t.categoryId, t.status),
    index('products_price_idx').on(t.priceVnd),
    index('products_name_lower_idx').on(sql`lower(${t.name})`),
  ],
);

// ─── product_images ─────────────────────────────────────────────────────
export const productImages = pgTable(
  'product_images',
  {
    id: pk(),
    productId: fk('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [uniqueIndex('product_images_product_position_uq').on(t.productId, t.position)],
);

// ─── inventory_movements ────────────────────────────────────────────────
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: pk(),
    productId: fk('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(),
    refType: inventoryRefType('ref_type').notNull(),
    // đa hình (orders.id hoặc null khi adjustment) nên KHÔNG đặt FK
    refId: fk('ref_id'),
    actorId: fk('actor_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    check('inventory_movements_delta_nonzero_ck', sql`${t.delta} <> 0`),
    index('inventory_movements_product_id_idx').on(t.productId),
  ],
);
