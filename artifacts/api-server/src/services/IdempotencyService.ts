import { eq } from "drizzle-orm";
import { db, economyTransactions } from "@workspace/db";

export class IdempotencyError extends Error {}

interface IdempotentRecord {
  key: string;
  result: any;
  timestamp: number;
}

const inMemoryStore = new Map<string, IdempotentRecord>();

export class IdempotencyService {
  /**
   * Checks if an idempotency key has already been processed.
   */
  static async isProcessed(key: string): Promise<boolean> {
    if (!key) return false;

    if (inMemoryStore.has(key)) {
      return true;
    }

    if (db) {
      try {
        const txRecord = await db.query.economyTransactions.findFirst({
          where: eq(economyTransactions.referenceId, key),
        });
        if (txRecord) return true;
      } catch {
        // Fallback to in-memory check
      }
    }

    return false;
  }

  /**
   * Retrieves stored result for an idempotency key if present.
   */
  static getStoredResult(key: string): any | null {
    const record = inMemoryStore.get(key);
    return record ? record.result : null;
  }

  /**
   * Marks an idempotency key as processed with optional result.
   */
  static async recordProcessed(key: string, result?: any): Promise<void> {
    if (!key) return;

    inMemoryStore.set(key, {
      key,
      result,
      timestamp: Date.now(),
    });

    // Keep memory map bounded (max 5000 items)
    if (inMemoryStore.size > 5000) {
      const oldestKey = inMemoryStore.keys().next().value;
      if (oldestKey) inMemoryStore.delete(oldestKey);
    }
  }

  /**
   * Executes an operation idempotently. If the key was previously processed, returns the cached result without re-executing.
   */
  static async executeIdempotent<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<{ processedBefore: boolean; result: T }> {
    if (await this.isProcessed(key)) {
      const stored = this.getStoredResult(key);
      if (stored !== null) {
        return { processedBefore: true, result: stored as T };
      }
      throw new IdempotencyError(`Operation with key "${key}" has already been processed.`);
    }

    const result = await operation();
    await this.recordProcessed(key, result);
    return { processedBefore: false, result };
  }

  static clearInMemoryStore(): void {
    inMemoryStore.clear();
  }
}
