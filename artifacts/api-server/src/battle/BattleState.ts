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
  alive: boolean;
  statusEffects: StatusEffect[];
  cooldowns: Record<string, number>;
  skills: {
    basic: Skill;
    skill1: Skill;
    skill2: Skill;
    ultimate: Skill;
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
    | "boss_enrage";
  targetId?: string;
  targetName?: string;
  amount?: number;
  critical?: boolean;
  skillName?: string;
  statusType?: StatusType;
}

export interface BattleSnapshot {
  phase: BattlePhase;
  round: number;
  turn: number;
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  actions: BattleAction[];
}
