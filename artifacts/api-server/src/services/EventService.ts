import { and, eq } from "drizzle-orm";
import { db, economyTransactions, events, userEvents, users } from "@workspace/db";
import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { Combatant } from "../battle/BattleState";
import { getOrCreateUser, getProfile, getTeam } from "./PhaseOneService";

export class EventServiceError extends Error {}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  enemyName: string;
  enemyHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemySpeed: number;
  rewardGold: number;
  rewardGems: number;
  rewardTickets: number;
  active: number;
}

export const MEMORY_EVENTS: EventItem[] = [
  {
    id: "e1000000-0000-4000-8000-000000000001",
    name: "Festival da Cerejeira em Flor",
    description: "Enfrente o Espírito de Sakura e resgate selos mágicos.",
    enemyName: "Espírito de Sakura",
    enemyHp: 2000,
    enemyAttack: 140,
    enemyDefense: 75,
    enemySpeed: 105,
    rewardGold: 500,
    rewardGems: 150,
    rewardTickets: 2,
    active: 1,
  },
  {
    id: "e1000000-0000-4000-8000-000000000002",
    name: "Invasão dos Demônios de Sangue",
    description: "Defenda a vila da invasão demoníaca da noite de lua cheia.",
    enemyName: "Guerreiro Demoníaco",
    enemyHp: 3500,
    enemyAttack: 210,
    enemyDefense: 100,
    enemySpeed: 110,
    rewardGold: 1000,
    rewardGems: 300,
    rewardTickets: 5,
    active: 1,
  },
];

const memoryUserEvents: Array<{ userId: string; eventId: string; completed: number; claimedAt: Date }> = [];

export async function listEvents(): Promise<EventItem[]> {
  if (!db) {
    return MEMORY_EVENTS.filter((e) => e.active === 1);
  }
  return db.select().from(events).where(eq(events.active, 1)) as unknown as EventItem[];
}

export async function getEventById(eventId: string): Promise<EventItem | null> {
  if (!db) {
    return MEMORY_EVENTS.find((e) => e.id === eventId && e.active === 1) ?? null;
  }
  const eventRecord = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.active, 1)),
  });
  return (eventRecord as unknown as EventItem) ?? null;
}

export async function challengeEvent(discordId: string, eventId: string) {
  const eventItem = await getEventById(eventId);
  if (!eventItem) throw new EventServiceError("Event not found or inactive.");

  if (!db) {
    let profile = await getProfile(discordId);
    if (!profile) {
      await getOrCreateUser(discordId, discordId);
      profile = await getProfile(discordId);
    }
    if (!profile) throw new EventServiceError("Profile not found.");

    let teamData = await getTeam(discordId);
    if (!teamData || !teamData.members.length) {
      if (profile.collection.length > 0) {
        const { replaceTeam } = await import("./PhaseOneService");
        await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
        teamData = await getTeam(discordId);
      }
    }
    if (!teamData || !teamData.members.length) throw new EventServiceError("Create a team before challenging events.");

    const player: Combatant[] = teamData.members.map(({ ownedId, level, character }) => {
      const maxHp = character.baseHp + level * 40;
      return SkillManager.createCombatant({
        id: ownedId,
        name: character.name,
        role: character.role,
        maxHp,
        hp: maxHp,
        attack: character.baseAttack + level * 8,
        defense: character.baseDefense + level * 5,
        speed: character.baseSpeed,
        critChance: 15,
        critDamage: 1.5,
        energy: 0,
        alive: true,
        passive: character.passive ?? undefined,
      });
    });

    const enemy: Combatant[] = [
      SkillManager.createCombatant({
        id: eventItem.id,
        name: eventItem.enemyName,
        role: "dps",
        maxHp: eventItem.enemyHp,
        hp: eventItem.enemyHp,
        attack: eventItem.enemyAttack,
        defense: eventItem.enemyDefense,
        speed: eventItem.enemySpeed,
        critChance: 10,
        critDamage: 1.5,
        energy: 0,
        alive: true,
      }),
    ];

    const result = new BattleEngine(player, enemy).run();
    const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";
    const rewards = status === "victory"
      ? { gold: eventItem.rewardGold, gems: eventItem.rewardGems, tickets: eventItem.rewardTickets }
      : { gold: 0, gems: 0, tickets: 0 };

    if (status === "victory") {
      profile.user.gold += rewards.gold;
      profile.user.gems += rewards.gems;
      profile.user.tickets += rewards.tickets;

      let userEv = memoryUserEvents.find((ue) => ue.userId === profile.user.id && ue.eventId === eventItem.id);
      if (!userEv) {
        userEv = { userId: profile.user.id, eventId: eventItem.id, completed: 1, claimedAt: new Date() };
        memoryUserEvents.push(userEv);
      } else {
        userEv.completed += 1;
        userEv.claimedAt = new Date();
      }
    }

    return { result, rewards, status };
  }

  const database = db;
  let user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  if (!user) {
    await getOrCreateUser(discordId, discordId);
    user = await database.query.users.findFirst({ where: eq(users.discordId, discordId) });
  }
  if (!user) throw new EventServiceError("Profile not found.");

  let teamData = await getTeam(discordId);
  if (!teamData || !teamData.members.length) {
    const profile = await getProfile(discordId);
    if (profile && profile.collection.length > 0) {
      const { replaceTeam } = await import("./PhaseOneService");
      await replaceTeam(discordId, "Equipe Principal", profile.collection.slice(0, 5).map((c) => c.ownedId));
      teamData = await getTeam(discordId);
    }
  }
  if (!teamData || !teamData.members.length) throw new EventServiceError("Create a team before challenging events.");

  const player: Combatant[] = teamData.members.map(({ ownedId, level, character }) => {
    const maxHp = character.baseHp + level * 40;
    return SkillManager.createCombatant({
      id: ownedId,
      name: character.name,
      role: character.role,
      maxHp,
      hp: maxHp,
      attack: character.baseAttack + level * 8,
      defense: character.baseDefense + level * 5,
      speed: character.baseSpeed,
      critChance: 15,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      passive: character.passive ?? undefined,
    });
  });

  const enemy: Combatant[] = [
    SkillManager.createCombatant({
      id: eventItem.id,
      name: eventItem.enemyName,
      role: "dps",
      maxHp: eventItem.enemyHp,
      hp: eventItem.enemyHp,
      attack: eventItem.enemyAttack,
      defense: eventItem.enemyDefense,
      speed: eventItem.enemySpeed,
      critChance: 10,
      critDamage: 1.5,
      energy: 0,
      alive: true,
    }),
  ];

  const result = new BattleEngine(player, enemy).run();
  const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";
  const rewards = status === "victory"
    ? { gold: eventItem.rewardGold, gems: eventItem.rewardGems, tickets: eventItem.rewardTickets }
    : { gold: 0, gems: 0, tickets: 0 };

  if (status === "victory") {
    await database.transaction(async (tx) => {
      await tx.update(users).set({
        gold: user.gold + rewards.gold,
        gems: user.gems + rewards.gems,
        tickets: user.tickets + rewards.tickets,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await tx.insert(economyTransactions).values({
        userId: user.id,
        currency: "gold",
        amount: rewards.gold,
        type: "earn",
        source: "event",
        referenceId: `event:${eventItem.id}:${Date.now()}`,
      });

      const existingUserEvent = await tx.query.userEvents.findFirst({
        where: and(eq(userEvents.userId, user.id), eq(userEvents.eventId, eventItem.id)),
      });

      if (!existingUserEvent) {
        await tx.insert(userEvents).values({
          userId: user.id,
          eventId: eventItem.id,
          completed: 1,
          claimedAt: new Date(),
        });
      } else {
        await tx.update(userEvents).set({
          completed: existingUserEvent.completed + 1,
          claimedAt: new Date(),
        }).where(eq(userEvents.id, existingUserEvent.id));
      }
    });
  }

  return { result, rewards, status };
}
