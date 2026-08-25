import { describe, expect, it } from "vitest";
import { EconomyError, getTransactionHistory, processTransaction } from "../EconomyService";

describe("EconomyService", () => {
  const discordId = "user_econ_1";

  it("processes positive transactions and updates balance", async () => {
    const res = await processTransaction({
      discordId,
      gold: 500,
      gems: 100,
      tickets: 5,
      type: "earn",
      source: "test",
      referenceId: "tx_100",
    });

    expect(res.transactionProcessed).toBe(true);
    expect(res.user.gold).toBeGreaterThanOrEqual(500);
    expect(res.user.gems).toBeGreaterThanOrEqual(1100); // 1000 base + 100
    expect(res.user.tickets).toBeGreaterThanOrEqual(15); // 10 base + 5
  });

  it("prevents double execution with the same referenceId (idempotency)", async () => {
    const res1 = await processTransaction({
      discordId,
      gold: 100,
      type: "earn",
      source: "test",
      referenceId: "tx_idem_1",
    });
    expect(res1.transactionProcessed).toBe(true);

    const res2 = await processTransaction({
      discordId,
      gold: 100,
      type: "earn",
      source: "test",
      referenceId: "tx_idem_1",
    });
    expect(res2.transactionProcessed).toBe(false);
  });

  it("throws EconomyError on negative balance overflow", async () => {
    await expect(
      processTransaction({
        discordId,
        gold: -999999,
        type: "spend",
        source: "test",
        referenceId: "tx_overflow_1",
      })
    ).rejects.toThrow(EconomyError);
  });

  it("fetches transaction history", async () => {
    const history = await getTransactionHistory(discordId);
    expect(Array.isArray(history)).toBe(true);
  });
});
