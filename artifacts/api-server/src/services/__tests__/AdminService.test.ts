import { describe, expect, it } from "vitest";
import {
  adminClearBattleState,
  adminCreateBanner,
  adminCreateCharacter,
  adminCreateEvent,
  adminGiveResources,
  adminRemoveResources,
  adminToggleBanner,
} from "../AdminService";

describe("AdminService", () => {
  it("should create a new character", async () => {
    const char = await adminCreateCharacter({
      anime: "Jujutsu Kaisen",
      name: "Satoru Gojo",
      rarity: "mythic",
      role: "dps",
      baseHp: 1500,
      baseAttack: 300,
      baseDefense: 150,
      baseSpeed: 135,
      passive: "Limitless",
    });

    expect(char).toBeDefined();
    expect(char.name).toBe("Satoru Gojo");
    expect(char.rarity).toBe("mythic");
  });

  it("should create and toggle a banner", async () => {
    const banner = await adminCreateBanner({
      name: "Banner Especial Gojo",
      type: "event",
      costCurrency: "gems",
      singleCost: 200,
      tenCost: 2000,
      rates: { mythic: 1, legendary: 3 },
    });

    expect(banner).toBeDefined();
    expect(banner.name).toBe("Banner Especial Gojo");

    const toggled = await adminToggleBanner(banner.id, 0);
    expect(toggled).toBeDefined();
  });

  it("should create an event", async () => {
    const event = await adminCreateEvent({
      name: "Invasão de Maldições",
      description: "Derrote Maldições Especiais para ganhar prêmios!",
      enemyName: "Sukuna",
      enemyHp: 10000,
      enemyAttack: 400,
      enemyDefense: 200,
      enemySpeed: 140,
      rewardGems: 500,
    });

    expect(event).toBeDefined();
    expect(event.name).toBe("Invasão de Maldições");
    expect(event.rewardGems).toBe(500);
  });

  it("should give and remove user resources", async () => {
    const discordId = `admin_test_user_${Date.now()}`;

    const giveRes = await adminGiveResources(discordId, {
      gold: 500,
      gems: 200,
      tickets: 5,
    });

    const initialGold = giveRes.user.gold;
    const initialGems = giveRes.user.gems;

    expect(initialGold).toBeGreaterThanOrEqual(500);
    expect(initialGems).toBeGreaterThanOrEqual(1200);

    const removeRes = await adminRemoveResources(discordId, {
      gold: 200,
      gems: 100,
    });

    expect(removeRes.user.gold).toBe(initialGold - 200);
    expect(removeRes.user.gems).toBe(initialGems - 100);
  });

  it("should clear battle state for user", async () => {
    const discordId = `admin_battle_user_${Date.now()}`;
    const res = await adminClearBattleState(discordId);
    expect(res.user).toBeDefined();
    expect(res.cleared).toBe(true);
  });
});
