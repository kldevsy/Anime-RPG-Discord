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
}

export interface BattleAction {
  round: number;
  actorId: string;
  actorName: string;
  type: "basic_attack" | "ultimate" | "heal" | "defeat";
  targetId?: string;
  targetName?: string;
  amount?: number;
  critical?: boolean;
}

export interface BattleSnapshot {
  phase: BattlePhase;
  round: number;
  turn: number;
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  actions: BattleAction[];
}