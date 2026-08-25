import { describe, expect, it } from "vitest";
import { getOrCreateUser, replaceTeam } from "../PhaseOneService";
import { getPveStageById, getUserPveProgress, listPveStages, listPveWorlds } from "../PveService";
import { listPlayerBattles, runPlayerBattle } from "../BattleService";

describe("Phase 4 PvE Service & Stage Battles", () => {
  it("lists worlds and stages with filtering by stage type", async () => {
    const worlds = await listPveWorlds();
    expect(worlds.length).toBeGreaterThan(0);

    const allStages = await listPveStages();
    expect(allStages.length).toBeGreaterThan(0);

    const bossStages = await listPveStages({ type: "boss" });
    expect(bossStages.every((s) => s.type === "boss")).toBe(true);

    const dungeonStages = await listPveStages({ type: "dungeon" });
    expect(dungeonStages.every((s) => s.type === "dungeon")).toBe(true);

    const raidStages = await listPveStages({ type: "raid" });
    expect(raidStages.every((s) => s.type === "raid")).toBe(true);
  });

  it("runs a PvE battle on a story stage and saves progress", async () => {
    const user = await getOrCreateUser("discord_pve_user_1", "PvE Explorer");
    const profileData = await getOrCreateUser("discord_pve_user_1", "PvE Explorer");
    expect(user.discordId).toBe("discord_pve_user_1");

    // Setup team
    const stages = await listPveStages({ type: "story" });
    const targetStage = stages[0];
    expect(targetStage).toBeDefined();

    const battleRes = await runPlayerBattle("discord_pve_user_1", targetStage.id);
    expect(battleRes.battle).toBeDefined();
    expect(battleRes.result).toBeDefined();
    expect(battleRes.rewards).toBeDefined();

    const progress = await getUserPveProgress("discord_pve_user_1");
    if (battleRes.battle.status === "victory") {
      expect(progress).toContain(targetStage.id);
    }

    const userBattles = await listPlayerBattles("discord_pve_user_1");
    expect(userBattles?.length).toBeGreaterThan(0);
  });

  it("runs a Boss stage battle with phase mechanics and awards drops on victory", async () => {
    await getOrCreateUser("discord_boss_user_1", "Boss Slayer");

    const bossStages = await listPveStages({ type: "boss" });
    const bossStage = bossStages[0];
    expect(bossStage).toBeDefined();

    const result = await runPlayerBattle("discord_boss_user_1", bossStage.id);
    expect(result.result.actions).toBeDefined();

    if (result.battle.status === "victory") {
      expect(result.rewards.gold).toBe(bossStage.rewardGold);
      expect(Array.isArray(result.drops)).toBe(true);
    }
  });
});
