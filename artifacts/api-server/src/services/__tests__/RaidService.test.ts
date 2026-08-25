import { describe, expect, it } from "vitest";
import { challengeRaid, getRaidById, getRaidLeaderboard, listRaids } from "../RaidService";
import { getProfile } from "../PhaseOneService";

describe("RaidService", () => {
  it("lists active raid bosses", async () => {
    const raids = await listRaids();
    expect(raids.length).toBeGreaterThan(0);
    expect(raids[0]).toHaveProperty("bossName");
    expect(raids[0]).toHaveProperty("currentHp");
  });

  it("gets raid by ID", async () => {
    const raids = await listRaids();
    const raid = await getRaidById(raids[0].id);
    expect(raid).not.toBeNull();
    expect(raid?.id).toBe(raids[0].id);
  });

  it("challenges raid boss, deals cumulative damage, and records leaderboard entry", async () => {
    const discordId = "test_raid_user_1";
    await getProfile(discordId);

    const raids = await listRaids();
    const initialHp = raids[0].currentHp;

    const outcome = await challengeRaid(discordId, raids[0].id);

    expect(outcome.damageDealt).toBeGreaterThanOrEqual(0);
    expect(outcome.raidStatus.currentHp).toBeLessThanOrEqual(initialHp);
    expect(outcome.rewards.gold).toBeGreaterThan(0);

    const leaderboard = await getRaidLeaderboard(raids[0].id);
    expect(leaderboard.length).toBeGreaterThan(0);
    expect(leaderboard[0].discordId).toBe(discordId);
    expect(leaderboard[0].damageDealt).toBe(outcome.damageDealt);
  });

  it("throws error when raid ID is invalid", async () => {
    await expect(challengeRaid("test_raid_user_1", "invalid-id")).rejects.toThrow("Raid boss not found or inactive.");
  });
});
