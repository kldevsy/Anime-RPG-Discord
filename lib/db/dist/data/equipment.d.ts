import type { Equipment } from "../schema/index.ts";
/**
 * 📦 Catálogo de Equipamentos
 *
 * Regras:
 * - Cada personagem equipa 1 item apenas
 * - Stats fixos (sem RNG)
 * - Equipável: character (sempre passiva), role (passiva opcional), universal (passiva rara)
 * - Raridades: common → mythic
 */
type EquipmentCatalog = Omit<Equipment, "id" | "createdAt">;
export declare const EQUIPMENT_CATALOG: EquipmentCatalog[];
/**
 * Valida se um equipamento pode ser equipado em um personagem
 */
export declare function canEquipItem(equipment: Equipment, characterName: string, characterRole: string): boolean;
/**
 * Retorna descrição de quem pode equipar
 */
export declare function getEquipableDescription(equipment: Equipment): string;
export {};
//# sourceMappingURL=equipment.d.ts.map