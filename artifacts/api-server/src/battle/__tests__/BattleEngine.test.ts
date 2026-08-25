import { describe, expect, it } from "vitest";
import { chooseAction } from "../AIController";
import { BattleEngine } from "../BattleEngine";
import { BattleLogger } from "../BattleLogger";
import { calculateDamage } from "../DamageCalculator";
import { SkillManager } from "../SkillManager";
import { StatusManager } from "../StatusManager";

describe("Phase 3 Battle Engine", () => {
  it("calculates damage taking defense, crit, and skills into account", () => {
    const attacker = SkillManager.createCombatant({ id: "att", name: "Attacker", role: "dps", attack: 100, critChance: 100, critDamage: 2.0 });
    const defender = SkillManager.createCombatant({ id: "def", name: "Defender", role: "tank", defense: 40 });

    const result = calculateDamage(attacker, defender, attacker.skills.basic, 50);
    expect(result.critical).toBe(true);
    expect(result.rawDamage).toBe(160); // (100 * 1.0 - 40 * 0.5) * 2.0 = 80 * 2.0 = 160
  });

  it("handles status effects like shields, burn, and stat buffs/debuffs", () => {
    const unit = SkillManager.createCombatant({ id: "u1", name: "Unit 1", role: "tank", attack: 100, hp: 500, maxHp: 500 });

    StatusManager.applyStatus(unit, { type: "attack_up", duration: 2, stacks: 1, value: 20 });
    expect(StatusManager.getEffectiveAttack(unit)).toBe(120);

    StatusManager.applyStatus(unit, { type: "shield", duration: 2, stacks: 1, value: 100 });
    expect(StatusManager.getTotalShield(unit)).toBe(100);

    const dmg = StatusManager.absorbDamageWithShield(unit, 60);
    expect(dmg.absorbed).toBe(60);
    expect(dmg.remainingDamage).toBe(0);
    expect(StatusManager.getTotalShield(unit)).toBe(40);

    StatusManager.applyStatus(unit, { type: "burn", duration: 2, stacks: 2, value: 25 });
    const dotResult = StatusManager.processTurnStartDoTs(unit);
    expect(dotResult.damage).toBe(50);
    expect(unit.hp).toBe(450);
  });

  it("chooses appropriate actions based on AI rules", () => {
    const healer = SkillManager.createCombatant({ id: "h1", name: "Healer", role: "healer", energy: 25 });
    const hurtAlly = SkillManager.createCombatant({ id: "a1", name: "Ally", role: "dps", hp: 100, maxHp: 500 });
    const enemy = SkillManager.createCombatant({ id: "e1", name: "Enemy", role: "tank" });

    const healAction = chooseAction(healer, [healer, hurtAlly], [enemy]);
    expect(healAction).not.toBeNull();
    expect(healAction?.actionKey).toBe("skill1");

    healer.energy = 100;
    const ultAction = chooseAction(healer, [healer, hurtAlly], [enemy]);
    expect(ultAction?.actionKey).toBe("ultimate");
  });

  it("runs full automatic battle through state machine to victory/defeat", () => {
    const p1 = SkillManager.createCombatant({ id: "p1", name: "Hero", role: "dps", attack: 120, speed: 110 });
    const e1 = SkillManager.createCombatant({ id: "e1", name: "Goblin", role: "tank", hp: 150, maxHp: 150, attack: 30, speed: 80 });

    const engine = new BattleEngine([p1], [e1]);
    const finalSnapshot = engine.run();

    expect(["VICTORY", "DEFEAT", "DRAW"]).toContain(finalSnapshot.phase);
    expect(finalSnapshot.actions.length).toBeGreaterThan(0);

    const logString = BattleLogger.formatAction(finalSnapshot.actions[0]);
    expect(logString).toContain("R1");
  });
});
