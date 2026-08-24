import { and, asc, eq } from "drizzle-orm";
import { battleActions, battleSnapshots, battles, characters, teamMembers, teams, userCharacters, users, economyTransactions } from "@workspace/db";
import { db } from "@workspace/db";
import { BattleEngine } from "../battle/BattleEngine";
import type { Combatant } from "../battle/BattleState";

export class BattleServiceError extends Error {}

export async function runPlayerBattle(discordId: string) {
  if (!db) throw new BattleServiceError("PostgreSQL is required for persistent battles.");
  const database = db;
  const user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) throw new BattleServiceError("Profile not found.");
  const team = await database.query.teams.findFirst({ where: eq(teams.userId, user.id), orderBy: asc(teams.createdAt) });
  if (!team) throw new BattleServiceError("Create a team before starting a battle.");
  const members = await database.select({ member: teamMembers, owned: userCharacters, character: characters })
    .from(teamMembers).innerJoin(userCharacters, eq(teamMembers.userCharacterId, userCharacters.id))
    .innerJoin(characters, eq(userCharacters.characterId, characters.id))
    .where(eq(teamMembers.teamId, team.id)).orderBy(asc(teamMembers.position));
  if (!members.length) throw new BattleServiceError("Your team is empty.");
  const player: Combatant[] = members.map(({ owned, character }) => ({
    id: owned.id, name: character.name, role: character.role, maxHp: character.baseHp + owned.level * 40,
    hp: character.baseHp + owned.level * 40, attack: character.baseAttack + owned.level * 8,
    defense: character.baseDefense + owned.level * 5, speed: character.baseSpeed, critChance: 15,
    critDamage: 1.5, energy: 0, alive: true,
  }));
  const enemy: Combatant[] = [{
    id: "story-enemy-01", name: "Guardião da Floresta", role: "tank", maxHp: 1400, hp: 1400,
    attack: 155, defense: 90, speed: 88, critChance: 8, critDamage: 1.4, energy: 0, alive: true,
  }];
  const result = new BattleEngine(player, enemy).run();
  const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";
  const rewards = status === "victory" ? { gold: 100, xp: 80 } : { gold: 0, xp: 0 };
  return database.transaction(async (tx) => {
    const [battle] = await tx.insert(battles).values({ userId: user.id, status, round: result.round, rewards, completedAt: new Date() }).returning();
    await tx.insert(battleSnapshots).values({ battleId: battle.id, round: result.round, turn: result.turn, state: result as unknown as Record<string, unknown> });
    if (result.actions.length) {
      await tx.insert(battleActions).values(result.actions.map((action) => ({
        battleId: battle.id, round: action.round, actorId: action.actorId, actionType: action.type,
        targetId: action.targetId, amount: action.amount, critical: action.critical ? 1 : 0,
      })));
    }
    if (status === "victory") {
      await tx.update(users).set({ gold: user.gold + rewards.gold, updatedAt: new Date() }).where(eq(users.id, user.id));
      await tx.insert(economyTransactions).values({ userId: user.id, currency: "gold", amount: rewards.gold, type: "earn", source: "battle", referenceId: `battle:${battle.id}` });
    }
    return { battle, result };
  });
}

export async function listPlayerBattles(discordId: string) {
  if (!db) throw new BattleServiceError("PostgreSQL is required for persistent battles.");
  const user = await db.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) return null;
  return db.select().from(battles).where(eq(battles.userId, user.id)).orderBy(asc(battles.createdAt));
}