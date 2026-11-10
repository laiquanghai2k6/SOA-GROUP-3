import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema';

export type Schema = typeof schema;
export type Database = NodePgDatabase<Schema>;
/** Đối tượng tx bên trong transaction (SRS 6.4: hàm có tham số tx chạy trong transaction do Orders điều phối). */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Repository nhận tham số này để chạy cả ngoài lẫn trong transaction. */
export type DbExecutor = Database | Transaction;
