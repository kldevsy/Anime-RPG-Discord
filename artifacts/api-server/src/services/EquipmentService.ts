import { db } from "@workspace/db";
import { 
  equipment, 
  userEquipment, 
  characterEquipped, 
  userCharacters,
  characters,
  type Equipment,
  type UserEquipment,
  type CharacterEquipped
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { canEquipItem } from "@workspace/db/data/equipment";

export class EquipmentService {
  /**
   * Lista todos os equipamentos do usuário
   */
  async listUserEquipment(userId: string): Promise<Array<UserEquipment & { equipment: Equipment }>> {
    const results = await db
      .select()
      .from(userEquipment)
      .innerJoin(equipment, eq(userEquipment.equipmentId, equipment.id))
      .where(eq(userEquipment.userId, userId));

    return results.map(row => ({
      ...row.user_equipment,
      equipment: row.equipment
    }));
  }

  /**
   * Busca equipamento equipado em um personagem do usuário
   */
  async getEquippedItem(userCharacterId: string): Promise<(UserEquipment & { equipment: Equipment }) | null> {
    const result = await db
      .select()
      .from(characterEquipped)
      .innerJoin(userEquipment, eq(characterEquipped.userEquipmentId, userEquipment.id))
      .innerJoin(equipment, eq(userEquipment.equipmentId, equipment.id))
      .where(eq(characterEquipped.userCharacterId, userCharacterId))
      .limit(1);

    if (result.length === 0) return null;

    return {
      ...result[0].user_equipment,
      equipment: result[0].equipment
    };
  }

  /**
   * Equipa um item em um personagem
   */
  async equipItem(userCharacterId: string, userEquipmentId: string): Promise<void> {
    // 1. Buscar dados do personagem
    const userChar = await db
      .select()
      .from(userCharacters)
      .innerJoin(characters, eq(userCharacters.characterId, characters.id))
      .where(eq(userCharacters.id, userCharacterId))
      .limit(1);

    if (userChar.length === 0) {
      throw new Error("Personagem não encontrado");
    }

    const character = userChar[0].characters;
    const userId = userChar[0].user_characters.userId;

    // 2. Buscar dados do equipamento
    const userEquip = await db
      .select()
      .from(userEquipment)
      .innerJoin(equipment, eq(userEquipment.equipmentId, equipment.id))
      .where(and(
        eq(userEquipment.id, userEquipmentId),
        eq(userEquipment.userId, userId)
      ))
      .limit(1);

    if (userEquip.length === 0) {
      throw new Error("Equipamento não encontrado ou não pertence a você");
    }

    const equip = userEquip[0].equipment;

    // 3. Validar se pode equipar
    if (!canEquipItem(equip, character.name, character.role)) {
      throw new Error(`${equip.name} não pode ser equipado em ${character.name}`);
    }

    // 4. Verificar se o equipamento já está equipado em outro personagem
    const alreadyEquipped = await db
      .select()
      .from(characterEquipped)
      .where(eq(characterEquipped.userEquipmentId, userEquipmentId))
      .limit(1);

    if (alreadyEquipped.length > 0) {
      throw new Error("Este equipamento já está equipado em outro personagem");
    }

    // 5. Desequipar item anterior (se houver)
    await db
      .delete(characterEquipped)
      .where(eq(characterEquipped.userCharacterId, userCharacterId));

    // 6. Equipar novo item
    await db.insert(characterEquipped).values({
      userCharacterId,
      userEquipmentId
    });
  }

  /**
   * Remove equipamento de um personagem
   */
  async unequipItem(userCharacterId: string): Promise<void> {
    await db
      .delete(characterEquipped)
      .where(eq(characterEquipped.userCharacterId, userCharacterId));
  }

  /**
   * Adiciona um equipamento ao inventário do usuário (para sistema futuro de drops/loja)
   */
  async giveEquipment(userId: string, equipmentId: string): Promise<string> {
    const result = await db
      .insert(userEquipment)
      .values({
        userId,
        equipmentId
      })
      .returning();

    return result[0].id;
  }

  /**
   * Busca equipamento do catálogo por nome
   */
  async findEquipmentByName(name: string): Promise<Equipment | null> {
    const result = await db
      .select()
      .from(equipment)
      .where(eq(equipment.name, name))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Lista todos os equipamentos do catálogo
   */
  async listCatalog(): Promise<Equipment[]> {
    return db.select().from(equipment);
  }

  /**
   * Busca equipamentos por tipo equipável
   */
  async findByEquipableType(type: "character" | "role" | "universal", target?: string): Promise<Equipment[]> {
    if (type === "universal") {
      return db
        .select()
        .from(equipment)
        .where(eq(equipment.equipableType, "universal"));
    }

    if (!target) {
      return db
        .select()
        .from(equipment)
        .where(eq(equipment.equipableType, type));
    }

    return db
      .select()
      .from(equipment)
      .where(and(
        eq(equipment.equipableType, type),
        eq(equipment.equipableTarget, target)
      ));
  }
}

export const equipmentService = new EquipmentService();
