import { describe, expect, it } from "vitest";
import { getCollectionLeaderboard, getPveLeaderboard, getTeamPowerLeaderboard, getWealthLeaderboard } from "../RankingService";

describe("RankingService", () => {
  it("returns wealth leaderboard", async () => {
    const list = await getWealthLeaderboard(5);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].rank).toBe(1);
  });

  it("returns PvE leaderboard", async () => {
    const list = await getPveLeaderboard(5);
    expect(Array.isArray(list)).toBe(true);
  });

  it("returns collection leaderboard", async () => {
    const list = await getCollectionLeaderboard(5);
    expect(Array.isArray(list)).toBe(true);
  });

  it("returns team power leaderboard", async () => {
    const list = await getTeamPowerLeaderboard(5);
    expect(Array.isArray(list)).toBe(true);
  });
});
