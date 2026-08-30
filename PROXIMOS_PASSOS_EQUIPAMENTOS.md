# 🎯 Próximos Passos - Sistema de Equipamentos

## ✅ O que foi feito:

### 1. Schema do Banco de Dados ✅
- `equipment` table - Catálogo de equipamentos
- `user_equipment` table - Inventário do usuário
- `character_equipped` table - Relação de equipamento equipado
- Enum `equipable_type` (character, role, universal)

### 2. Catálogo de Equipamentos ✅
Criado `lib/db/src/data/equipment.ts` com:
- **8 Equipamentos de Personagem Específico** (sempre com passiva):
  - Bandana do Zoro (Épico)
  - Venda dos Seis Olhos - Gojo (Mítico)
  - Colar de Tsunade - Naruto (Lendário)
  - Lâmina Kusanagi - Sasuke (Lendário)
  - Chapéu de Palha - Luffy (Épico)
  - Akatsuki Coat - Itachi (Mítico)
  - Espada Demoníaca - Meliodas (Lendário)
  - Espada Nichirin Preta - Tanjiro (Épico)

- **10 Equipamentos de Classe** (passiva opcional):
  - DPS: Katana Afiada (c/ passiva), Adaga Rápida, Espada Vampírica (c/ passiva)
  - Tank: Escudo Indestrutível (c/ passiva), Armadura Pesada (c/ passiva), Placa de Aço
  - Healer: Cajado da Cura (c/ passiva), Amuleto da Vida
  - Control: Orbe do Controle (c/ passiva), Corrente Paralisante (c/ passiva)
  - Support: Banner de Batalha (c/ passiva), Tambor de Guerra

- **5 Equipamentos Universais** (passiva rara):
  - Anel do Destino (c/ passiva) - Mítico
  - Colar de Energia - Épico
  - Brincos de Prata - Raro
  - Botas do Vento - Incomum
  - Luvas de Força - Incomum

### 3. EquipmentService ✅
Criado `artifacts/api-server/src/services/EquipmentService.ts` com:
- `listUserEquipment(userId)` - Lista equipamentos do usuário
- `getEquippedItem(userCharacterId)` - Busca equipamento equipado
- `equipItem(userCharacterId, userEquipmentId)` - Equipa item
- `unequipItem(userCharacterId)` - Remove equipamento
- `giveEquipment(userId, equipmentId)` - Adiciona ao inventário (para sistema futuro)
- `findEquipmentByName(name)` - Busca por nome
- `listCatalog()` - Lista catálogo
- `findByEquipableType()` - Busca por tipo

### 4. Script de Seed ✅
Criado `lib/db/scripts/seed-equipment.mjs`:
- Sincroniza catálogo de equipamentos
- Insert/Update automático
- Integrado ao `startup-sync.mjs`

### 5. Startup Sync Atualizado ✅
- Adicionado sync de equipamentos após personagens
- Script `pnpm run seed:equipment` no package.json

---

## 🔄 Próximos Passos para Completar:

### Passo 6: Gerar Migration
```bash
cd lib/db
pnpm drizzle-kit generate
pnpm run migrate
```

### Passo 7: Integrar Equipamentos com Batalha

Modificar `BattleService.ts` e `AdaptivePvpService.ts`:

```typescript
// Ao criar Combatant, aplicar bonus de equipamento
async function createCombatantWithEquipment(userChar, character) {
  const equipped = await equipmentService.getEquippedItem(userChar.id);
  
  let equipmentBonuses = {
    hp: 0, attack: 0, defense: 0, speed: 0, 
    critChance: 0, critDamage: 0
  };
  
  let equipmentPassive = null;
  
  if (equipped) {
    const equip = equipped.equipment;
    equipmentBonuses = {
      hp: equip.bonusHp,
      attack: equip.bonusAttack,
      defense: equip.bonusDefense,
      speed: equip.bonusSpeed,
      critChance: equip.bonusCritChance,
      critDamage: equip.bonusCritDamage
    };
    equipmentPassive = equip.passiveAbility;
  }
  
  // Aplicar bonus aos stats
  const combatant: Combatant = {
    id: userChar.id,
    name: character.name,
    hp: baseHp + equipmentBonuses.hp,
    maxHp: baseHp + equipmentBonuses.hp,
    attack: baseAttack + equipmentBonuses.attack,
    defense: baseDefense + equipmentBonuses.defense,
    speed: baseSpeed + equipmentBonuses.speed,
    critChance: 15 + equipmentBonuses.critChance,
    critDamage: 1.5 + (equipmentBonuses.critDamage / 100),
    // ...
    passives: [
      character.passiveAbility,
      equipmentPassive
    ].filter(Boolean)
  };
  
  return combatant;
}
```

### Passo 8: Criar Comandos Discord

Adicionar ao `commands.ts`:

```typescript
new SlashCommandBuilder()
  .setName("equipamento")
  .setDescription("Gerenciar equipamentos")
  .addSubcommand(sub =>
    sub
      .setName("equipar")
      .setDescription("Equipa um item em um personagem")
      .addStringOption(opt =>
        opt
          .setName("personagem")
          .setDescription("Nome do personagem")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption(opt =>
        opt
          .setName("equipamento")
          .setDescription("Nome do equipamento")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("remover")
      .setDescription("Remove equipamento de um personagem")
      .addStringOption(opt =>
        opt
          .setName("personagem")
          .setDescription("Nome do personagem")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("lista")
      .setDescription("Lista seus equipamentos")
  )
  .addSubcommand(sub =>
    sub
      .setName("catalogo")
      .setDescription("Ver catálogo de equipamentos")
  ),
```

### Passo 9: Handlers dos Comandos

Adicionar ao `handlers.ts`:

```typescript
case "equipamento": {
  const subcommand = interaction.options.getSubcommand();
  
  if (subcommand === "equipar") {
    // Equipar item
  } else if (subcommand === "remover") {
    // Remover item
  } else if (subcommand === "lista") {
    // Listar equipamentos do usuário
  } else if (subcommand === "catalogo") {
    // Mostrar catálogo
  }
  break;
}
```

### Passo 10: Atualizar Embeds

Modificar `/personagem` para mostrar equipamento:

```typescript
.addFields({
  name: "⚡ Equipamento",
  value: equipped 
    ? `${equipped.equipment.name} [${equipped.equipment.rarity}]\n` +
      `└─ ${formatEquipmentBonuses(equipped.equipment)}\n` +
      `└─ ${equipped.equipment.passiveAbility ? `Passiva: ${equipped.equipment.passiveAbility.name}` : 'Sem passiva'}`
    : "Nenhum equipamento equipado",
  inline: false
})
```

### Passo 11: Sistema de Obtenção (FUTURO)
**⚠️ NÃO implementar agora - deixar para depois:**
- Drops de batalha (PvE, Arena, Boss, Raid)
- Loja de equipamentos (comprar com Gold/Gemas)
- Eventos (recompensas especiais)
- Crafting
- Gacha de equipamentos

---

## 🎮 Como Testar Após Implementar:

### 1. Dar equipamento para teste:
```sql
-- Dar "Bandana do Zoro" para um usuário
INSERT INTO user_equipment (user_id, equipment_id)
SELECT u.id, e.id
FROM users u, equipment e
WHERE u.discord_id = 'SEU_DISCORD_ID'
AND e.name = 'Bandana do Zoro';
```

### 2. Testar comandos:
```
/equipamento equipar personagem:Zoro equipamento:Bandana do Zoro
/personagem Zoro
/equipamento remover personagem:Zoro
/equipamento lista
```

### 3. Testar em batalha:
```
/batalha
(Verificar que stats e passivas do equipamento estão aplicados)
```

---

## 📦 Resumo do que falta:

- [ ] Gerar migration (Passo 6)
- [ ] Integrar com BattleService (Passo 7)
- [ ] Criar comandos `/equipamento` (Passo 8)
- [ ] Criar handlers (Passo 9)
- [ ] Atualizar embeds (Passo 10)
- [ ] ~~Sistema de obtenção~~ (FUTURO - não fazer agora)

---

Pronto para continuar! 🚀
