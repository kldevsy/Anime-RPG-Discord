import { describe, expect, it } from "vitest";
import {
  getOrCreateUser,
  getProfile,
  getTeam,
  listCharacters,
  replaceTeam,
} from "../PhaseOneService";

describe("PhaseOneService", () => {
  it("creates user profile with starter characters in local memory mode", async () => {
    const discordId = "user_test_123";
    const user = await getOrCreateUser(discordId, "TestPlayer");

    expect(user).toBeDefined();
    expect(user.discordId).toBe(discordId);
    expect(user.username).toBe("TestPlayer");
    expect(user.gems).toBe(1000);
    expect(user.tickets).toBe(10);

    const profile = await getProfile(discordId);
    expect(profile).not.toBeNull();
    expect(profile!.collection.length).toBe(3);
  });

  it("lists character catalog with filters", async () => {
    const all = await listCharacters({});
    expect(all.length).toBeGreaterThanOrEqual(5);

    const narutoAnime = await listCharacters({ anime: "Naruto" });
    expect(narutoAnime.every((c) => c.anime === "Naruto")).toBe(true);

    const epicOnly = await listCharacters({ rarity: "epic" });
    expect(epicOnly.every((c) => c.rarity === "epic")).toBe(true);
  });

  it("sets and gets team successfully within valid limit", async () => {
    const discordId = "user_team_test";
    await getOrCreateUser(discordId, "TeamPlayer");
    const profile = await getProfile(discordId);
    const ownedIds = profile!.collection.map((c) => c.ownedId);

    const teamResult = await replaceTeam(discordId, "Equipe principal", ownedIds);
    expect(teamResult).not.toBeNull();
    expect(teamResult!.members.length).toBe(ownedIds.length);

    const fetchedTeam = await getTeam(discordId);
    expect(fetchedTeam).not.toBeNull();
    expect(fetchedTeam!.members.length).toBe(ownedIds.length);
  });

  it("rejects team selection exceeding 5 characters", async () => {
    const discordId = "user_over_limit";
    await getOrCreateUser(discordId, "OverLimitUser");
    const fakeOwnedIds = [
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000004",
      "00000000-0000-4000-8000-000000000005",
      "00000000-0000-4000-8000-000000000006",
    ];

    await expect(replaceTeam(discordId, "Equipe principal", fakeOwnedIds)).rejects.toThrow(
      "A team can contain at most 5 characters."
    );
  });

  it("rejects duplicate characters in the same team", async () => {
    const discordId = "user_dup_test";
    await getOrCreateUser(discordId, "DupUser");
    const profile = await getProfile(discordId);
    const ownedId = profile!.collection[0].ownedId;

    await expect(
      replaceTeam(discordId, "Equipe principal", [ownedId, ownedId])
    ).rejects.toThrow("A team cannot contain the same owned character more than once.");
  });
});
