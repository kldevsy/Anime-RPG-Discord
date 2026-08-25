import { describe, it, expect, beforeEach } from "vitest";
import { IdempotencyService, IdempotencyError } from "../IdempotencyService";

describe("IdempotencyService", () => {
  beforeEach(() => {
    IdempotencyService.clearInMemoryStore();
  });

  it("records and checks idempotency keys", async () => {
    const key = "tx-key-1001";
    expect(await IdempotencyService.isProcessed(key)).toBe(false);

    await IdempotencyService.recordProcessed(key, { goldAwarded: 100 });
    expect(await IdempotencyService.isProcessed(key)).toBe(true);
    expect(IdempotencyService.getStoredResult(key)).toEqual({ goldAwarded: 100 });
  });

  it("prevents double execution of idempotent operations", async () => {
    const key = "claim-daily-2026-03-01";
    let executionCount = 0;

    const op = async () => {
      executionCount += 1;
      return { reward: "50 gems" };
    };

    const first = await IdempotencyService.executeIdempotent(key, op);
    expect(first.processedBefore).toBe(false);
    expect(first.result).toEqual({ reward: "50 gems" });
    expect(executionCount).toBe(1);

    const second = await IdempotencyService.executeIdempotent(key, op);
    expect(second.processedBefore).toBe(true);
    expect(second.result).toEqual({ reward: "50 gems" });
    expect(executionCount).toBe(1);
  });
});
