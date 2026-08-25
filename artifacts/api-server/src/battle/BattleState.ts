export type BattlePhase =
  | "WAITING"
  | "PREPARING"
  | "INITIATIVE"
  | "ROUND_START"
  | "CHARACTER_TURN"
  | "ACTION"
  | "DAMAGE"
  | "STATUS_PROCESS"
  | "DEATH_CHECK"
  | "NEXT_TURN"
  | "ROUND_END"
  | "VICTORY"
  | "DEFEAT"
  | "DRAW";

export type CombatantRole = "tank" | "dps" | "support" | "healer" | "control";

export type SkillType =
  | "DAMAGE"
  | "HEAL"
  | "BUFF"
  | "DEBUFF"
  | "STUN"
  | "DOT"
  | "SHIELD"
  | "AOE"
  | "EXECUTE"
  | "REVIVE";

export type TargetType = "single_enemy" | "aoe_enemy" | "single_ally" | "aoe_ally" | "self";

export type StatusType =
  | "burn"
  | "shock"
  | "freeze"
  | "stun"
  | "poison"
  | "bleed"
  | "shield"
  | "attack_up"
  | "attack_down"
  | "defense_up"
  | "defense_down"
  | "speed_up"
  | "speed_down";

export interface StatusEffect {
  id: string;
  type: StatusType;
  duration: number;
  stacks: number;
  value: number;
  originId?: string;
}

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  energyCost: number;
  cooldown: number;
  targetType: TargetType;
  multiplier: number;
  statusEffects?: Array<{
    type: StatusType;
    chance: number;
    duration: number;
    value: number;
  }>;
  /** Machine-readable modifiers; never infer mechanics from a display name. */
  conditionalEffects?: SkillConditionalEffect[];
}

export type UltimateChargeSource = "turn_start" | "basic_hit" | "damage_dealt" | "damage_received" | "critical_hit" | "defeat";

/**
 * Charge is intentionally separate from `energy`: energy pays ordinary skills,
 * while ultimate charge is reset only by an ultimate.  Charge is capped at
 * `ultimateChargeRequired`; stun/freeze do not remove it; death and revive
 * preserve it; boss phase changes preserve it; and each AoE victim contributes
 * its own damage/critical/defeat trigger.
 */
export interface UltimateChargePolicy {
  onTurnStart?: number;
  onBasicHit?: number;
  onDamageDealt?: number;
  onDamageReceived?: number;
  onCriticalHit?: number;
  onDefeat?: number;
  /** An ultimate may opt into a cooldown; the default is no cooldown. */
  cooldown?: number;
}

export interface SkillConditionalEffect {
  condition: "target_missing_hp_above" | "critical_hit";
  threshold?: number;
  damageMultiplierBonus?: number;
  ultimateChargeBonus?: number;
}

export interface UltimateSkill extends Skill {
  stableKey: string;
  chargePolicy: UltimateChargePolicy;
}

export interface UltimateChargeTelemetry {
  source: UltimateChargeSource | "ultimate_used";
  previous: number;
  delta: number;
  final: number;
  round: number;
}

export interface Combatant {
  id: string;
  name: string;
  role: CombatantRole;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critChance: number;
  critDamage: number;
  energy: number;
  maxEnergy: number;
  ultimateCharge: number;
  ultimateChargeRequired: number;
  ultimateReady: boolean;
  ultimateChargeTelemetry: UltimateChargeTelemetry[];
  alive: boolean;
  statusEffects: StatusEffect[];
  cooldowns: Record<string, number>;
  skills: {
    basic: Skill;
    skill1: Skill;
    skill2: Skill;
    ultimate: UltimateSkill;
  };
  passive?: string;
  isBoss?: boolean;
  currentPhase?: number;
  maxPhases?: number;
  enrageRound?: number;
  isEnraged?: boolean;
  drops?: Array<{ itemKey: string; quantity: number; chance: number }>;
}

export interface BattleAction {
  round: number;
  actorId: string;
  actorName: string;
  type:
    | "basic_attack"
    | "skill1"
    | "skill2"
    | "ultimate"
    | "heal"
    | "shield"
    | "buff"
    | "debuff"
    | "stun"
    | "dot"
    | "revive"
    | "defeat"
    | "status_applied"
    | "status_dot"
    | "boss_phase_change"
    | "boss_enrage"
    | "ultimate_charge"
    | "ultimate_ready"
    | "ultimate_used";
  targetId?: string;
  targetName?: string;
  amount?: number;
  /** Allows presentation clients to distinguish ultimate damage from healing. */
  isHealing?: boolean;
  critical?: boolean;
  skillName?: string;
  statusType?: StatusType;
  ultimateKey?: string;
  chargeSource?: UltimateChargeSource | "ultimate_used";
  previousCharge?: number;
  chargeDelta?: number;
  finalCharge?: number;
}

export interface BattleSnapshot {
  phase: BattlePhase;
  round: number;
  turn: number;
  initiative: string[];
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  actions: BattleAction[];
}

/** A server-validated request to spend the current ultimate charge. */
export interface UltimateDecision {
  actorId: string;
  targetId?: string;
  useUltimate: boolean;
}

export type UltimateDecisionProvider = (context: {
  snapshot: BattleSnapshot;
  actor: Combatant;
  validTargets: Combatant[];
}) => Promise<UltimateDecision | null> | UltimateDecision | null;
