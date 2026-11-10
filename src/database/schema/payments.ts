import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { paymentMethod, paymentStatus } from './enums';
import { createdAt, fk, pk, publicId, updatedAt, vnd } from './helpers';
import { orders } from './orders';

export const payments = pgTable(
  'payments',
  {
    id: pk(),
    publicId: publicId(),
    orderId: fk('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    method: paymentMethod('method').notNull(),
    status: paymentStatus('status').notNull().default('pending'),
    amountVnd: vnd('amount_vnd').notNull(),
    providerRef: varchar('provider_ref', { length: 100 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('payments_order_id_idx').on(t.orderId),
    check('payments_amount_nonneg_ck', sql`${t.amountVnd} >= 0`),
  ],
);

export const paymentEvents = pgTable(
  'payment_events',
  {
    id: pk(),
    eventId: varchar('event_id', { length: 100 }).notNull(),
    paymentId: fk('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'restrict' }),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    // PAY-03: chống xử lý lặp webhook
    uniqueIndex('payment_events_event_id_uq').on(t.eventId),
    index('payment_events_payment_id_idx').on(t.paymentId),
  ],
);
