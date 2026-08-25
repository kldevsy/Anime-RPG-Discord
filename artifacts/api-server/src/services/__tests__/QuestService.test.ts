import { describe, expect, it } from "vitest";
import { claimQuestReward, getUserQuests, QuestError, updateQuestProgress } from "../QuestService";

describe("QuestService", () => {
  const discordId = "user_quest_1";

  it("lists active user quests", async () => {
    const quests = await getUserQuests(discordId);
    expect(quests.length).toBeGreaterThan(0);
    expect(quests[0].quest).toBeDefined();
    expect(quests[0].userQuest).toBeDefined();
  });

  it("updates quest progress upon user actions", async () => {
    const updated = await updateQuestProgress(discordId, "battle_win", 1);
    expect(updated.length).toBeGreaterThan(0);
    expect(updated[0].userQuest.progress).toBe(1);
    expect(updated[0].userQuest.completed).toBe(1);
  });

  it("claims completed quest rewards atomically", async () => {
    const quests = await getUserQuests(discordId);
    const battleQuest = quests.find((q) => q.quest.requirementType === "battle_win");
    expect(battleQuest).toBeDefined();

    const claimRes = await claimQuestReward(discordId, battleQuest!.quest.id, "claim_quest_1");
    expect(claimRes.rewards.gold).toBe(100);
    expect(claimRes.userQuest.claimedAt).not.toBeNull();
  });

  it("prevents claiming an already claimed quest", async () => {
    const quests = await getUserQuests(discordId);
    const battleQuest = quests.find((q) => q.quest.requirementType === "battle_win");

    await expect(
      claimQuestReward(discordId, battleQuest!.quest.id, "claim_quest_2")
    ).rejects.toThrow(QuestError);
  });
});
