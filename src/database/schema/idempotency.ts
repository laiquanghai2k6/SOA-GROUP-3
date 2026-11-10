import { index, integer, jsonb, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { createdAt, fk, pk, tstz } from './helpers';
import { users } from './users';

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: pk(),
    key: varchar('key', { length: 64 }).notNull(), // 8–64 ký tự (SRS 3.7)
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: varchar('endpoint', { length: 200 }).notNull(), // vd: "POST /orders"
    requestHash: varchar('request_hash', { length: 64 }).notNull(), // SHA-256 của body
    responseStatus: integer('response_status').notNull(),
    responseBody: jsonb('response_body').$type<unknown>().notNull(),
    expiresAt: tstz('expires_at').notNull(), // created_at + 24h
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('idempotency_keys_user_endpoint_key_uq').on(t.userId, t.endpoint, t.key),
    index('idempotency_keys_expires_at_idx').on(t.expiresAt),
  ],
);
