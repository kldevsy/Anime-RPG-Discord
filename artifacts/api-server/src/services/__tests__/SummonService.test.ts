import { describe, expect, it } from "vitest";
import { getOrCreateUser } from "../PhaseOneService";
import { getSummonHistory, listActiveBanners, summon, SummonError } from "../SummonService";

describe("SummonService (Phase 2 Gacha)", () => {
  it("lists active banners", async () => {
    const banners = await listActiveBanners();
    expect(banners.length).toBeGreaterThanOrEqual(1);
    expect(banners[0]).toHaveProperty("name");
    expect(banners[0]).toHaveProperty("rates");
  });

  it("performs a single (1x) summon using tickets", async () => {
    const discordId = "gacha_user_1";
    await getOrCreateUser(discordId, "GachaPlayer1");

    const banners = await listActiveBanners();
    const ticketBanner = banners.find((b) => b.costCurrency === "tickets")!;

    const result = await summon(discordId, ticketBanner.id, 1, `test-key-single-${Date.now()}`);
    expect(result).toBeDefined();
    expect(result.quantity).toBe(1);
    expect(result.results.length).toBe(1);
    expect(result.results[0]).toHaveProperty("characterId");
    expect(result.results[0]).toHaveProperty("rarity");
  });

  it("performs a 10x multi summon using tickets", async () => {
    const discordId = "gacha_user_10";
    await getOrCreateUser(discordId, "GachaPlayer10");

    const banners = await listActiveBanners();
    const ticketBanner = banners.find((b) => b.costCurrency === "tickets")!;

    const result = await summon(discordId, ticketBanner.id, 10, `test-key-multi-${Date.now()}`);
    expect(result).toBeDefined();
    expect(result.quantity).toBe(10);
    expect(result.results.length).toBe(10);
  });

  it("returns idempotent result when repeating the same idempotency key", async () => {
    const discordId = "gacha_user_idempotent";
    await getOrCreateUser(discordId, "IdempotentPlayer");

    const banners = await listActiveBanners();
    const banner = banners[0];
    const idempotencyKey = `idem-key-${Date.now()}`;

    const firstCall = await summon(discordId, banner.id, 1, idempotencyKey);
    const secondCall = await summon(discordId, banner.id, 1, idempotencyKey);

    expect(firstCall.id).toBe(secondCall.id);
  });

  it("rejects summon when user balance is insufficient", async () => {
    const discordId = "gacha_user_poor";
    const user = await getOrCreateUser(discordId, "BrokePlayer");
    user.tickets = 0;

    const banners = await listActiveBanners();
    const ticketBanner = banners.find((b) => b.costCurrency === "tickets")!;

    await expect(
      summon(discordId, ticketBanner.id, 1, `poor-key-${Date.now()}`)
    ).rejects.toThrow(SummonError);
  });

  it("retrieves summon history for user", async () => {
    const discordId = "gacha_user_history";
    await getOrCreateUser(discordId, "HistoryPlayer");

    const banners = await listActiveBanners();
    const banner = banners[0];
    const key = `hist-key-${Date.now()}`;

    await summon(discordId, banner.id, 1, key);
    const history = await getSummonHistory(discordId);

    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].idempotencyKey).toBe(key);
  });
});
