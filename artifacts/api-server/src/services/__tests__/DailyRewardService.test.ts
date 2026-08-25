import { describe, expect, it } from "vitest";
import { claimDailyReward, DailyRewardError, getDailyRewardStatus } from "../DailyRewardService";

describe("DailyRewardService", () => {
  const discordId = "user_daily_1";

  it("checks daily reward status for new user", async () => {
    const status = await getDailyRewardStatus(discordId);
    expect(status.canClaim).toBe(true);
    expect(status.currentStreak).toBe(0);
    expect(status.nextReward.day).toBe(1);
  });

  it("claims daily reward successfully", async () => {
    const res = await claimDailyReward(discordId, "daily_claim_1");
    expect(res.streak).toBe(1);
    expect(res.reward.gold).toBe(500);
  });

  it("prevents double claiming on the same day", async () => {
    await expect(
      claimDailyReward(discordId, "daily_claim_2")
    ).rejects.toThrow(DailyRewardError);
  });
});
