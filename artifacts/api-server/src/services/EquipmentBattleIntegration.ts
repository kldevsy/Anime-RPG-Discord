import { equipmentService } from "./EquipmentService";
import type { Combatant } from "../battle/BattleState";
import { logger } from "../lib/logger";

/**
 * Busca e aplica bonus de equipamento em um Combatant
 * Retorna o Combatant atualizado com stats e passiva de equipamento
 */
export async function applyCombatantEquipment(
  combatant: Combatant,
  userCharacterId: string
): Promise<Combatant> {
  try {
    // Buscar equipamento equipado
    const equipped = await equipmentService.getEquippedItem(userCharacterId);
    
    if (!equipped) {
      // Sem equipamento - retorna combatant inalterado
      return combatant;
    }
    
    const equip = equipped.equipment;
    
    logger.info({
      character: combatant.name,
      equipment: equip.name,
      rarity: equip.rarity,
      bonuses: {
        hp: equip.bonusHp,
        attack: equip.bonusAttack,
        defense: equip.bonusDefense,
        speed: equip.bonusSpeed,
        critChance: equip.bonusCritChance,
        critDamage: equip.bonusCritDamage
      }
    }, `[EQUIPMENT] Applying equipment to ${combatant.name}`);
    
    // Aplica bonus de stats
    const updatedCombatant: Combatant = {
      ...combatant,
      hp: combatant.hp + equip.bonusHp,
      maxHp: combatant.maxHp + equip.bonusHp,
      attack: combatant.attack + equip.bonusAttack,
      defense: combatant.defense + equip.bonusDefense,
      speed: combatant.speed + equip.bonusSpeed,
      critChance: combatant.critChance + equip.bonusCritChance,
      critDamage: combatant.critDamage + (equip.bonusCritDamage / 100),
    };
    
    // Adiciona passiva do equipamento (se tiver)
    if (equip.passiveAbility) {
      logger.info({
        character: combatant.name,
        equipmentPassive: equip.passiveAbility
      }, `[EQUIPMENT] Adding equipment passive to ${combatant.name}`);
      
      // Se já tem passivas, adiciona a do equipamento
      if (updatedCombatant.passives && Array.isArray(updatedCombatant.passives)) {
        updatedCombatant.passives = [...updatedCombatant.passives, equip.passiveAbility];
      } else {
        updatedCombatant.passives = [equip.passiveAbility];
      }
    }
    
    return updatedCombatant;
    
  } catch (error) {
    logger.error({
      error,
      userCharacterId,
      characterName: combatant.name
    }, "[EQUIPMENT] Error applying equipment to combatant");
    
    // Em caso de erro, retorna combatant inalterado
    return combatant;
  }
}

/**
 * Aplica equipamentos em um array de Combatants
 * Recebe array de userCharacterIds na mesma ordem dos combatants
 */
export async function applyTeamEquipment(
  combatants: Combatant[],
  userCharacterIds: string[]
): Promise<Combatant[]> {
  if (combatants.length !== userCharacterIds.length) {
    logger.warn({
      combatantsLength: combatants.length,
      idsLength: userCharacterIds.length
    }, "[EQUIPMENT] Combatants and IDs length mismatch");
    return combatants;
  }
  
  const updatedCombatants: Combatant[] = [];
  
  for (let i = 0; i < combatants.length; i++) {
    const combatant = combatants[i];
    const userCharacterId = userCharacterIds[i];
    
    const updated = await applyCombatantEquipment(combatant, userCharacterId);
    updatedCombatants.push(updated);
  }
  
  return updatedCombatants;
}
