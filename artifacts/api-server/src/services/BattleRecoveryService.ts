import { desc, eq } from "drizzle-orm";
import { battleActions, battleSnapshots, battles, db, users, economyTransactions } from "@workspace/db";
import { BattleEngine } from "../battle/BattleEngine";
import type { BattleSnapshot, Combatant } from "../battle/BattleState";

export class BattleRecoveryError extends Error {}

export interface RecoveredBattleResult {
  battleId: string;
  recoveredFromRound: number;
  finalRound: number;
  status: "victory" | "defeat" | "draw";
  actionsCount: number;
}

export class BattleRecoveryService {
  /**
   * Scans database for incomplete ("running") battles and restores them from the latest snapshot.
   */
  static async recoverRunningBattles(): Promise<RecoveredBattleResult[]> {
    if (!db) {
      return [];
    }

    const runningBattles = await db.select().from(battles).where(eq(battles.status, "running"));
    const results: RecoveredBattleResult[] = [];

    for (const battle of runningBattles) {
      try {
        const recovered = await this.recoverSingleBattle(battle.id);
        if (recovered) results.push(recovered);
      } catch (err) {
        // Continue attempting recovery for other running battles
      }
    }

    return results;
  }

  /**
   * Recovers a single battle by ID using its stored snapshot.
   */
  static async recoverSingleBattle(battleId: string): Promise<RecoveredBattleResult | null> {
    if (!db) return null;

    const battle = await db.query.battles.findFirst({
      where: eq(battles.id, battleId),
    });

    if (!battle) throw new BattleRecoveryError(`Battle with ID ${battleId} not found.`);
    if (battle.status !== "running") {
      return null;
    }

    const latestSnapshot = await db.query.battleSnapshots.findFirst({
      where: eq(battleSnapshots.battleId, battleId),
      orderBy: desc(battleSnapshots.round),
    });

    if (!latestSnapshot || !latestSnapshot.state) {
      // Mark as draw if state is unrecoverable
      await db.update(battles).set({ status: "draw", completedAt: new Date() }).where(eq(battles.id, battleId));
      return {
        battleId,
        recoveredFromRound: 0,
        finalRound: battle.round,
        status: "draw",
        actionsCount: 0,
      };
    }

    const snapshotData = latestSnapshot.state as unknown as BattleSnapshot;
    const playerTeam = (snapshotData.playerTeam || []) as Combatant[];
    const enemyTeam = (snapshotData.enemyTeam || []) as Combatant[];

    const engine = new BattleEngine(playerTeam, enemyTeam);
    const result = engine.run();

    const status = result.phase === "VICTORY" ? "victory" : result.phase === "DEFEAT" ? "defeat" : "draw";

    await db.transaction(async (tx) => {
      await tx
        .update(battles)
        .set({
          status,
          round: result.round,
          completedAt: new Date(),
        })
        .where(eq(battles.id, battleId));

      await tx.insert(battleSnapshots).values({
        battleId,
        round: result.round,
        turn: result.turn,
        state: result as unknown as Record<string, unknown>,
      });

      if (result.actions.length) {
        await tx.insert(battleActions).values(
          result.actions.map((action) => ({
            battleId,
            round: action.round,
            actorId: action.actorId,
            actionType: action.type,
            targetId: action.targetId,
            amount: action.amount,
            critical: action.critical ? 1 : 0,
          }))
        );
      }
    });

    return {
      battleId,
      recoveredFromRound: latestSnapshot.round,
      finalRound: result.round,
      status,
      actionsCount: result.actions.length,
    };
  }
}
