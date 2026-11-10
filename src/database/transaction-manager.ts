import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from './database.tokens';
import type { Database, Transaction } from './database.types';

/**
 * Service mở transaction mà không cần import Drizzle (NFR-MNT-01):
 *   await this.tx.run(async (tx) => { await this.repo.decrementStock(tx, items); ... });
 */
@Injectable()
export class TransactionManager {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  run<T>(
    work: (tx: Transaction) => Promise<T>,
    config?: Parameters<Database['transaction']>[1],
  ): Promise<T> {
    return this.db.transaction(work, config);
  }
}
