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

    healer.ultimateCharge = healer.ultimateChargeRequired;
    healer.ultimateReady = true;
    const ultAction = chooseAction(healer, [healer, hurtAlly], [enemy]);
    // A revive is held until there is a defeated ally, even when charged.
    expect(ultAction?.actionKey).toBe("skill1");

    const dps = SkillManager.createCombatant({ id: "d1", name: "DPS", role: "dps", ultimateCharge: 100, ultimateChargeRequired: 100, ultimateReady: true });
    const damageUltAction = chooseAction(dps, [dps], [enemy]);
    expect(damageUltAction?.actionKey).toBe("ultimate");
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

  it("keeps Goku and Itadori ultimate charge policies distinct and capped", () => {
    const goku = SkillManager.createCombatant({ id: "goku", name: "Goku", role: "dps", ultimateChargeRequired: 140 });
    const itadori = SkillManager.createCombatant({ id: "itadori", name: "Itadori", role: "dps", ultimateChargeRequired: 85 });
    goku.skills.ultimate.chargePolicy = { onBasicHit: 14, onDamageReceived: 8, onCriticalHit: 5 };
    itadori.skills.ultimate.chargePolicy = { onBasicHit: 28, onDamageReceived: 12, onCriticalHit: 18 };
    const engine = new BattleEngine([goku], [itadori]);

    engine.addUltimateCharge(goku, "basic_hit");
    engine.addUltimateCharge(itadori, "basic_hit");
    engine.addUltimateCharge(itadori, "damage_received");
    engine.addUltimateCharge(itadori, "critical_hit");
    engine.addUltimateCharge(itadori, "basic_hit");
    engine.addUltimateCharge(itadori, "basic_hit");

    expect(goku.ultimateCharge).toBe(14);
    expect(itadori.ultimateCharge).toBe(85);
    expect(itadori.ultimateReady).toBe(true);
    expect(engine.snapshot().actions.filter((action) => action.type === "ultimate_ready")).toHaveLength(1);
  });

  it("does not spend ultimate charge on normal skills and resets only ultimate charge after use", () => {
    const hero = SkillManager.createCombatant({ id: "hero", name: "Hero", role: "dps", energy: 50, ultimateCharge: 100, ultimateChargeRequired: 100, ultimateReady: true, speed: 200 });
    const enemy = SkillManager.createCombatant({ id: "enemy", name: "Enemy", role: "tank", hp: 2_000, maxHp: 2_000, speed: 1 });
    const engine = new BattleEngine([hero], [enemy]);

    for (let index = 0; index < 6; index += 1) engine.step();

    expect(hero.energy).toBe(50);
    expect(hero.ultimateCharge).toBe(0);
    expect(hero.ultimateReady).toBe(false);
    expect(engine.snapshot().actions.some((action) => action.type === "ultimate_used" && action.previousCharge === 100 && action.finalCharge === 0)).toBe(true);
    engine.addUltimateCharge(hero, "basic_hit");
    expect(hero.ultimateCharge).toBe(25);
  });

  it("leaves ultimate charge untouched by a common skill and permits another ultimate after recharge", () => {
    const hero = SkillManager.createCombatant({ id: "hero", name: "Hero", role: "dps", energy: 50, ultimateCharge: 40, ultimateChargeRequired: 100, speed: 200 });
    const enemy = SkillManager.createCombatant({ id: "enemy", name: "Enemy", role: "tank", hp: 10_000, maxHp: 10_000, speed: 1 });
    const engine = new BattleEngine([hero], [enemy]);

    for (let index = 0; index < 6; index += 1) engine.step(); // skill2 spends ordinary energy only
    expect(hero.energy).toBe(10);
    expect(hero.ultimateCharge).toBe(40);

    const repeater = SkillManager.createCombatant({ id: "repeater", name: "Repeater", role: "dps", ultimateChargeRequired: 100, speed: 200 });
    repeater.skills.ultimate.chargePolicy = { onTurnStart: 100 };
    const repeatEnemy = SkillManager.createCombatant({ id: "repeat-enemy", name: "Repeat Enemy", role: "tank", hp: 10_000, maxHp: 10_000, speed: 1 });
    const result = new BattleEngine([repeater], [repeatEnemy]).run(3);
    expect(result.actions.filter((action) => action.type === "ultimate_used" && action.actorId === repeater.id).length).toBeGreaterThan(1);
  });
});
