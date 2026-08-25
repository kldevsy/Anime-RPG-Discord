import type { BattleAction } from "./BattleState";

export class BattleLogger {
  static formatAction(action: BattleAction): string {
    const r = `R${action.round}`;
    const actor = action.actorName;
    const target = action.targetName ? ` -> ${action.targetName}` : "";
    const critStr = action.critical ? " [CRÍTICO!]" : "";

    switch (action.type) {
      case "basic_attack":
      case "skill1":
      case "skill2":
      case "ultimate":
        return `${r} • ${actor} • ${action.skillName || "Ataque"}${target} • dano ${action.amount || 0}${critStr}`;
      case "heal":
        return `${r} • ${actor} • ${action.skillName || "Cura"}${target} • +${action.amount || 0} HP`;
      case "shield":
        return `${r} • ${actor} • ${action.skillName || "Escudo"}${target} • +${action.amount || 0} Escudo`;
      case "buff":
      case "debuff":
      case "status_applied":
        return `${r} • ${actor} • Efeito ${action.statusType || "Status"}${target}`;
      case "status_dot":
        return `${r} • ${actor} • Dano Contínuo (${action.statusType})${target} • dano ${action.amount || 0}`;
      case "revive":
        return `${r} • ${actor} • Ressuscitou${target} • ${action.amount || 0} HP`;
      case "ultimate_charge":
      case "ultimate_ready":
      case "ultimate_used":
        return `${r} • ${actor} • Ultimate ${action.ultimateKey} (${action.chargeSource}): ${action.previousCharge ?? 0} ${action.chargeDelta && action.chargeDelta > 0 ? "+" : ""}${action.chargeDelta ?? 0} = ${action.finalCharge ?? 0}`;
      case "defeat":
        return `${r} • Sistema • ${actor} foi derrotado`;
      default:
        return `${r} • ${actor} • ${action.type}`;
    }
  }
}
