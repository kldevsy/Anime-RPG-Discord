import { describe, expect, it } from "vitest";
import { challengePvp, getPvpLeaderboard, getPvpProfile, listPvpOpponents } from "../PvpService";
import { getProfile } from "../PhaseOneService";

describe("PvpService", () => {
  it("initializes and retrieves PvP profile", async () => {
    const discordId = "pvp_user_1";
    await getProfile(discordId);

    const profile = await getPvpProfile(discordId);
    expect(profile.discordId).toBe(discordId);
    expect(profile.rating).toBe(1000);
    expect(profile.wins).toBe(0);
    expect(profile.losses).toBe(0);
  });

  it("lists PvP opponents", async () => {
    const discordId = "pvp_user_1";
    const opponents = await listPvpOpponents(discordId);
    expect(opponents.length).toBeGreaterThan(0);
  });

  it("executes automated Team vs Team PvP combat and updates ratings", async () => {
    const challenger = "pvp_challenger_1";
    const defender = "pvp_defender_1";

    await getProfile(challenger);
    await getProfile(defender);

    const matchOutcome = await challengePvp(challenger, defender);

    expect(matchOutcome.matchId).toBeDefined();
    expect(matchOutcome.round).toBeGreaterThan(0);
    expect(matchOutcome.ratingChange).toBe(25);
    expect([challenger, defender]).toContain(matchOutcome.winnerDiscordId);

    const challengerPvp = await getPvpProfile(challenger);
    expect(challengerPvp.rating).toBe(matchOutcome.challengerNewRating);

    const leaderboard = await getPvpLeaderboard();
    expect(leaderboard.length).toBeGreaterThan(0);
  });

  it("prevents self PvP challenge", async () => {
    await expect(challengePvp("pvp_user_1", "pvp_user_1")).rejects.toThrow("You cannot challenge yourself to a PvP match.");
  });
});
