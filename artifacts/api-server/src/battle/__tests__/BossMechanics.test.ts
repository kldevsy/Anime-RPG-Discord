import { describe, expect, it } from "vitest";
import { BattleEngine } from "../BattleEngine";
import { SkillManager } from "../SkillManager";

describe("Phase 4 Boss Mechanics", () => {
  it("handles multi-phase boss transitions on zero HP", () => {
    const hero = SkillManager.createCombatant({
      id: "hero1",
      name: "Hero",
      role: "dps",
      attack: 300,
      speed: 120,
    });

    const boss = SkillManager.createCombatant({
      id: "boss1",
      name: "Raid Boss",
      role: "tank",
      hp: 100,
      maxHp: 100,
      attack: 100,
      defense: 20,
      speed: 80,
      isBoss: true,
      currentPhase: 1,
      maxPhases: 2,
      enrageRound: 10,
    });

    const engine = new BattleEngine([hero], [boss]);
    const snapshot = engine.run();

    const phaseChangeAction = snapshot.actions.find((a) => a.type === "boss_phase_change");
    expect(phaseChangeAction).toBeDefined();
    expect(phaseChangeAction?.amount).toBe(2);
  });

  it("triggers boss enrage mode when round threshold or low HP is reached", () => {
    const hero = SkillManager.createCombatant({
      id: "hero2",
      name: "Hero",
      role: "tank",
      attack: 10,
      hp: 5000,
      maxHp: 5000,
      speed: 110,
    });

    const boss = SkillManager.createCombatant({
      id: "boss2",
      name: "Enraging Boss",
      role: "dps",
      hp: 200,
      maxHp: 1000, // 20% HP -> triggers enrage
      attack: 50,
      speed: 90,
      isBoss: true,
      currentPhase: 1,
      maxPhases: 1,
      enrageRound: 15,
    });

    const engine = new BattleEngine([hero], [boss]);
    const snapshot = engine.run();

    const enrageAction = snapshot.actions.find((a) => a.type === "boss_enrage");
    expect(enrageAction).toBeDefined();
    expect(boss.isEnraged).toBe(true);
  });
});
