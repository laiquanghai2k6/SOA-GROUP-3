import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { userRole, userStatus } from './enums';
import { createdAt, fk, pk, publicId, tstz, updatedAt } from './helpers';

// ─── users ──────────────────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: pk(),
    publicId: publicId(),
    email: varchar('email', { length: 254 }).notNull(), // luôn lưu chữ thường
    passwordHash: text('password_hash').notNull(), // Argon2id, không bao giờ vào DTO
    fullName: varchar('full_name', { length: 120 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    role: userRole('role').notNull().default('customer'),
    status: userStatus('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('users_email_uq').on(t.email),
    check('users_email_lowercase_ck', sql`${t.email} = lower(${t.email})`),
  ],
);

// ─── refresh_tokens ─────────────────────────────────────────────────────
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: pk(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    familyId: uuid('family_id').notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(), // SHA-256 hex
    expiresAt: tstz('expires_at').notNull(),
    revokedAt: tstz('revoked_at'),
    replacedById: fk('replaced_by_id').references((): AnyPgColumn => refreshTokens.id, {
      onDelete: 'set null',
    }),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 45 }), // đủ chứa IPv6
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('refresh_tokens_token_hash_uq').on(t.tokenHash),
    index('refresh_tokens_user_id_idx').on(t.userId),
    index('refresh_tokens_family_id_idx').on(t.familyId),
  ],
);

// ─── addresses ──────────────────────────────────────────────────────────
export const addresses = pgTable(
  'addresses',
  {
    id: pk(),
    publicId: publicId(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientName: varchar('recipient_name', { length: 120 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    line1: varchar('line1', { length: 255 }).notNull(),
    ward: varchar('ward', { length: 120 }).notNull(),
    district: varchar('district', { length: 120 }).notNull(),
    province: varchar('province', { length: 120 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('addresses_user_id_idx').on(t.userId),
    // USR-04: mỗi user tối đa MỘT địa chỉ mặc định
    uniqueIndex('addresses_one_default_per_user_uq')
      .on(t.userId)
      .where(sql`${t.isDefault} = true`),
  ],
);
