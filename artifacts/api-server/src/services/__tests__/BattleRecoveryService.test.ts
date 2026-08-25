import { describe, it, expect } from "vitest";
import { BattleRecoveryService } from "../BattleRecoveryService";

describe("BattleRecoveryService", () => {
  it("handles battle recovery safely in memory/db mode", async () => {
    const results = await BattleRecoveryService.recoverRunningBattles();
    expect(Array.isArray(results)).toBe(true);
  });
});
