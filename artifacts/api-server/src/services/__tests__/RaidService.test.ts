import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  characters,
  raidInstanceParticipants,
  raidInstances,
  raidTeamMembers,
  userCharacters,
  users,
} from "@workspace/db/schema";

type Fixture = {
  raid?: Record<string, unknown>;
  user: Record<string, unknown>;
  participant?: Record<string, unknown>;
  participants: Array<Record<string, unknown>>;
  participantLookup?: Array<Record<string, unknown>>;
  teamMembers: Array<Record<string, unknown>>;
  userChar: Record<string, unknown>;
  character: Record<string, unknown>;
};

const database = vi.hoisted(() => ({
  fixture: undefined as Fixture | undefined,
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@workspace/db", () => ({ db: database }));

import { raidService } from "../RaidService";

const leader = { id: "leader-id", discordId: "leader" };
const member = { id: "member-id", discordId: "member" };

function createFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    raid: {
      id: "raid-id",
      leaderId: leader.id,
      roomCode: "RAID-TEST",
      raidMapId: "forest_guardian",
      difficulty: "normal",
      status: "waiting",
      maxPlayers: 4,
      expiresAt: new Date(Date.now() + 60_000),
    },
    user: leader,
    participant: { id: "participant-id", raidInstanceId: "raid-id", userId: leader.id, contribution: 0 },
    participants: [{ id: "participant-id", raidInstanceId: "raid-id", userId: leader.id, contribution: 0 }],
    teamMembers: [],
    userChar: { id: "character-id", userId: leader.id, characterId: "catalog-character", level: 10, masteryLevel: 1 },
    character: { id: "catalog-character", name: "Test Hero", baseHp: 100 },
    ...overrides,
  };
}

function installDatabaseFixture(fixture: Fixture) {
  database.fixture = fixture;
  let participantLookup = fixture.participantLookup;

  database.select.mockImplementation((selection?: unknown) => {
    let source: unknown;
    let hasJoin = false;
    const rows = () => {
      if (source === users) return [fixture.user];
      if (source === raidInstances) return hasJoin ? [] : fixture.raid ? [fixture.raid] : [];
      if (source === raidInstanceParticipants) return fixture.participants;
      if (source === raidTeamMembers) return fixture.teamMembers;
      if (source === userCharacters) return [{ userChar: fixture.userChar, char: fixture.character }];
      return [];
    };
    const query = {
      from(table: unknown) { source = table; return query; },
      innerJoin() { hasJoin = true; return query; },
      where() { return query; },
      orderBy() { return query; },
      limit() {
        if (source === raidInstanceParticipants && participantLookup) {
          const result = participantLookup.slice(0, 1);
          participantLookup = undefined;
          return Promise.resolve(result);
        }
        return Promise.resolve(rows().slice(0, 1));
      },
      then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
        return Promise.resolve(rows().slice()).then(resolve, reject);
      },
    };
    void selection;
    return query;
  });

  database.insert.mockImplementation((table: unknown) => ({
    values(values: Record<string, unknown>) {
      if (table === raidInstances) {
        fixture.raid = { id: "created-raid-id", ...values };
        return { returning: async () => [fixture.raid] };
      }
      if (table === raidInstanceParticipants) {
        const participant = { id: `participant-${fixture.participants.length + 1}`, ...values };
        fixture.participants.push(participant);
        fixture.participant ??= participant;
        return Promise.resolve();
      }
      if (table === raidTeamMembers) {
        if (fixture.teamMembers.some((member) => member.userCharacterId === values.userCharacterId)) {
          return Promise.reject({ code: "23505", constraint: "raid_team_members_raid_character_unique" });
        }
        if (fixture.teamMembers.some((member) => member.position === values.position)) {
          return Promise.reject({ code: "23505", constraint: "raid_team_members_raid_position_unique" });
        }
        fixture.teamMembers.push({ id: `team-member-${fixture.teamMembers.length + 1}`, ...values });
      }
      return Promise.resolve();
    },
  }));

  database.update.mockImplementation((table: unknown) => ({
    set() {
      return {
        where: async () => {
          if (table === raidInstanceParticipants && fixture.participant) {
            fixture.participant.contribution = Number(fixture.participant.contribution) + 1;
            fixture.participants[0]!.contribution = fixture.participant.contribution;
          }
        },
      };
    },
  }));
  database.transaction.mockImplementation(async (callback: (tx: typeof database) => unknown) => callback(database));
}

describe("raidService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a room with its leader as the first participant", async () => {
    const fixture = createFixture({ raid: undefined, participants: [], participant: undefined });
    installDatabaseFixture(fixture);

    const result = await raidService.createRaid({ leaderId: "leader", raidMapId: "forgotten_tower", difficulty: "normal" });

    expect(result.raidInstance.id).toBe("created-raid-id");
    expect(fixture.participants).toEqual([expect.objectContaining({ userId: leader.id, contribution: 0 })]);
  });

  it("adds a user to a waiting room", async () => {
    const fixture = createFixture({ user: member, participantLookup: [], participants: [createFixture().participants[0]!] });
    installDatabaseFixture(fixture);

    const result = await raidService.joinRaid({ userId: "member", roomCode: "raid-test" });

    expect(result.participantCount).toBe(2);
    expect(fixture.participants).toHaveLength(2);
    expect(fixture.participants[1]).toMatchObject({ userId: member.id, contribution: 0 });
  });

  it("rejects joining the same room twice", async () => {
    const fixture = createFixture({ participantLookup: [createFixture().participant!] });
    installDatabaseFixture(fixture);

    await expect(raidService.joinRaid({ userId: "leader", roomCode: "RAID-TEST" })).rejects.toThrow("Você já está nesta raid!");
  });

  it("rejects a character when all four team positions are occupied", async () => {
    const fixture = createFixture({
      teamMembers: Array.from({ length: 4 }, (_, index) => ({
        id: `team-member-${index + 1}`,
        userCharacterId: `existing-character-${index + 1}`,
        position: index + 1,
      })),
    });
    installDatabaseFixture(fixture);

    await expect(raidService.addCharacter({ raidInstanceId: "raid-id", userId: "leader", userCharacterId: "character-id" })).rejects.toThrow("Equipe já está completa! (4/4 personagens)");
    expect(fixture.teamMembers).toHaveLength(4);
  });

  it("rejects adding the same character twice", async () => {
    const fixture = createFixture();
    installDatabaseFixture(fixture);

    await raidService.addCharacter({ raidInstanceId: "raid-id", userId: "leader", userCharacterId: "character-id" });
    await expect(raidService.addCharacter({ raidInstanceId: "raid-id", userId: "leader", userCharacterId: "character-id" })).rejects.toThrow("Este personagem já está na equipe!");
  });

  it("persists one character and returns the same idempotent error for concurrent duplicate additions", async () => {
    const fixture = createFixture();
    installDatabaseFixture(fixture);

    const attempts = await Promise.allSettled([
      raidService.addCharacter({ raidInstanceId: "raid-id", userId: "leader", userCharacterId: "character-id" }),
      raidService.addCharacter({ raidInstanceId: "raid-id", userId: "leader", userCharacterId: "character-id" }),
    ]);

    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.find((attempt) => attempt.status === "rejected")).toMatchObject({ reason: new Error("Este personagem já está na equipe!") });
    expect(fixture.teamMembers).toEqual([expect.objectContaining({ userCharacterId: "character-id", position: 1 })]);
    expect(fixture.participant?.contribution).toBe(1);
  });

  it("increments contribution exactly once when a character is added", async () => {
    const fixture = createFixture();
    installDatabaseFixture(fixture);

    await raidService.addCharacter({ raidInstanceId: "raid-id", userId: "leader", userCharacterId: "character-id" });

    expect(fixture.participant?.contribution).toBe(1);
    expect(fixture.teamMembers).toHaveLength(1);
  });

  it("rejects starting a raid when requested by someone other than its leader", async () => {
    const fixture = createFixture({ user: member });
    installDatabaseFixture(fixture);

    await expect(raidService.startRaidBattle("raid-id", "member")).rejects.toThrow("Apenas o líder pode iniciar a raid!");
  });
});
