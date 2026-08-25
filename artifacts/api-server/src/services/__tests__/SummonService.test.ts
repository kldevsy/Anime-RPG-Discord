import { describe, expect, it } from "vitest";
import { getOrCreateUser, getProfile, getTeam, replaceTeam } from "../PhaseOneService";
import {
  getSummonHistory,
  getUserInventory,
  listActiveBanners,
  summon,
  SummonError,
} from "../SummonService";

describe("SummonService (Phase 2)", () => {
  it("lists active banners", async () => {
    const banners = await listActiveBanners();
    expect(banners.length).toBeGreaterThanOrEqual(1);
    expect(banners[0]).toHaveProperty("name");
    expect(banners[0]).toHaveProperty("rates");
  });

  it("performs a single (1x) summon successfully and deducts currency", async () => {
    const discordId = "user_summon_single";
    const user = await getOrCreateUser(discordId, "Summoner1");
    const initialTickets = user.tickets;

    const banners = await listActiveBanners();
    const banner = banners[0];
    const idempotencyKey = "key_single_summon_001";

    const result = await summon(discordId, banner.id, 1, idempotencyKey);
    expect(result).toBeDefined();
    expect(result.quantity).toBe(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toHaveProperty("characterId");
    expect(result.results[0]).toHaveProperty("rarity");

    const inventory = await getUserInventory(discordId);
    expect(inventory).not.toBeNull();
    expect(inventory!.currencies.tickets).toBe(initialTickets - banner.singleCost);
  });

  it("performs a multi (10x) summon successfully", async () => {
    const discordId = "user_summon_multi";
    await getOrCreateUser(discordId, "Summoner10");

    const banners = await listActiveBanners();
    const banner = banners[0];
    const idempotencyKey = "key_multi_summon_010";

    const result = await summon(discordId, banner.id, 10, idempotencyKey);
    expect(result).toBeDefined();
    expect(result.quantity).toBe(10);
    expect(result.results).toHaveLength(10);
  });

  it("enforces idempotency when repeating same summon request", async () => {
    const discordId = "user_idempotency_test";
    await getOrCreateUser(discordId, "IdemPlayer");

    const banners = await listActiveBanners();
    const banner = banners[0];
    const idempotencyKey = "key_duplicate_test_12345";

    const firstCall = await summon(discordId, banner.id, 1, idempotencyKey);
    const secondCall = await summon(discordId, banner.id, 1, idempotencyKey);

    expect(firstCall.id).toBe(secondCall.id);
  });

  it("rejects summon when user has insufficient balance", async () => {
    const discordId = "user_poor_player";
    const user = await getOrCreateUser(discordId, "PoorPlayer");
    user.tickets = 0; // zero out tickets

    const banners = await listActiveBanners();
    const banner = banners[0];
    const idempotencyKey = "key_insufficient_funds_001";

    await expect(summon(discordId, banner.id, 1, idempotencyKey)).rejects.toThrow(SummonError);
  });

  it("stores summoned ownership in the same memory collection used by profile and team", async () => {
    const discordId = "user_summon_team_shared_store";
    await getOrCreateUser(discordId, "SharedStoreSummoner");

    const banners = await listActiveBanners();
    const banner = banners[0];
    const result = await summon(discordId, banner.id, 1, "key_shared_store_summon_001");
    const ownedId = result.results[0].ownedId;

    const profile = await getProfile(discordId);
    expect(profile?.collection.some((owned) => owned.ownedId === ownedId)).toBe(true);

    const teamResult = await replaceTeam(discordId, "Equipe invocada", [ownedId]);
    expect(teamResult?.members[0].ownedId).toBe(ownedId);

    const fetchedTeam = await getTeam(discordId);
    expect(fetchedTeam?.members[0].ownedId).toBe(ownedId);
  });

  it("fetches summon history and inventory correctly", async () => {
    const discordId = "user_history_inv_test";
    await getOrCreateUser(discordId, "HistoryUser");

    const banners = await listActiveBanners();
    const banner = banners[0];
    const key1 = "hist_key_001_test";
    const key2 = "hist_key_002_test";

    await summon(discordId, banner.id, 1, key1);
    await summon(discordId, banner.id, 1, key2);

    const history = await getSummonHistory(discordId);
    expect(history.length).toBeGreaterThanOrEqual(2);

    const inv = await getUserInventory(discordId);
    expect(inv).not.toBeNull();
    expect(inv!.currencies).toHaveProperty("gold");
    expect(inv!.currencies).toHaveProperty("gems");
    expect(inv!.currencies).toHaveProperty("tickets");
  });
});
