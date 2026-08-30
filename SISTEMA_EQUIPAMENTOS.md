# ⚔️ Sistema de Equipamentos - Design Completo

## 🎯 Conceito Base

Cada personagem pode equipar **1 equipamento** que fornece:
- **Boosts de stats específicos** (HP, ATK, DEF, SPD, CRIT, etc)
- **Passiva opcional** (segunda passiva do personagem)
- **Equipável por:** Personagem específico, Classe, ou Universal

## 📊 Estrutura de Equipamento

```typescript
interface Equipment {
  id: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  description: string;
  
  // Equipável
  equipableType: "character" | "role" | "universal";
  equipableTarget?: string; // Nome do personagem ou role
  
  // Stats (FIXOS, sem RNG)
  bonusHp?: number;
  bonusAttack?: number;
  bonusDefense?: number;
  bonusSpeed?: number;
  bonusCritChance?: number;
  bonusCritDamage?: number;
  
  // Passiva (opcional, mas sempre presente em equipamentos de personagem específico)
  passiveAbility?: PassiveAbility;
  
  imageUrl?: string;
}
```

## 🎯 Tipos de Equipável

### 1. **Personagem Específico** (Sempre tem passiva)
```typescript
{
  name: "Bandana do Zoro",
  equipableType: "character",
  equipableTarget: "Roronoa Zoro",
  bonusAttack: 50,
  bonusSpeed: 15,
  passiveAbility: THREE_SWORD_STYLE_MASTER // OBRIGATÓRIO
}
```

### 2. **Classe (Role)** (Passiva opcional)
```typescript
{
  name: "Armadura Pesada",
  equipableType: "role",
  equipableTarget: "tank",
  bonusHp: 200,
  bonusDefense: 40,
  passiveAbility: FORTIFY // Opcional
}
```

### 3. **Universal** (Passiva opcional)
```typescript
{
  name: "Anel de Poder",
  equipableType: "universal",
  bonusAttack: 25,
  bonusDefense: 25,
  // Sem passiva
}
```

## 🎮 Regras de Equipamento

### ✅ Pode Equipar SE:
1. **Personagem específico:** `equipment.equipableTarget === character.name`
2. **Classe:** `equipment.equipableTarget === character.role`
3. **Universal:** `equipment.equipableType === "universal"`

### ❌ Não Pode Equipar SE:
- Personagem não bate com `equipableTarget`
- Classe não bate com `equipableTarget`
- Personagem já tem outro equipamento equipado

## 📈 Progressão de Stats

### Raridades e Power Level:
| Raridade | Bonus Total | Passiva? | Exemplo |
|----------|-------------|----------|---------|
| Common | 30-50 stats | Raro (10%) | +25 ATK, +15 HP |
| Uncommon | 60-90 stats | Às vezes (25%) | +40 ATK, +30 DEF |
| Rare | 100-140 stats | Frequente (50%) | +60 ATK, +50 HP, +20 SPD |
| Epic | 150-200 stats | Sim (75%) | +80 ATK, +70 DEF, +30 SPD |
| Legendary | 220-280 stats | Sempre (100%) | +120 ATK, +100 HP, +50 DEF |
| Mythic | 300-400 stats | Sempre (100%) | +150 ATK, +150 HP, +80 DEF, +20 CRIT |

### Stats específicos vs balanceados:
- **Equipamento de personagem:** Foca em 2-3 stats principais
- **Equipamento de classe:** Balanceado para a classe
- **Universal:** Stats distribuídos igualmente

## 🎨 Exemplos de Equipamentos

### 🥇 Personagem Específico (Sempre Passiva)

```typescript
// ZORO - Épico
{
  name: "Bandana do Zoro",
  rarity: "epic",
  equipableType: "character",
  equipableTarget: "Roronoa Zoro",
  bonusAttack: 80,
  bonusSpeed: 30,
  bonusCritChance: 10,
  passiveAbility: {
    id: "three_sword_mastery",
    name: "Maestria das Três Espadas",
    description: "Ataques básicos têm 30% de chance de atacar 3 vezes",
    // ... (obrigatório)
  }
}

// GOJO - Mítico
{
  name: "Venda dos Seis Olhos",
  rarity: "mythic",
  equipableType: "character",
  equipableTarget: "Satoru Gojo",
  bonusSpeed: 50,
  bonusCritChance: 20,
  passiveAbility: {
    id: "six_eyes",
    name: "Seis Olhos",
    description: "Ganha +30 de carga de ultimate por turno",
    // ... (obrigatório)
  }
}

// NARUTO - Lendário
{
  name: "Colar de Uzumaki Naruto",
  rarity: "legendary",
  equipableType: "character",
  equipableTarget: "Naruto Uzumaki",
  bonusHp: 150,
  bonusAttack: 80,
  bonusDefense: 50,
  passiveAbility: {
    id: "nine_tails_chakra",
    name: "Chakra da Nove Caudas",
    description: "Ao ficar abaixo de 40% HP, ganha +50% ATK e +30% SPD",
    // ... (obrigatório)
  }
}
```

### ⚔️ Classe - DPS (Passiva Opcional)

```typescript
// Épico COM passiva
{
  name: "Katana Afiada",
  rarity: "epic",
  equipableType: "role",
  equipableTarget: "dps",
  bonusAttack: 100,
  bonusCritChance: 15,
  passiveAbility: {
    id: "sharp_blade",
    name: "Lâmina Afiada",
    description: "Críticos causam +30% de dano",
  }
}

// Raro SEM passiva
{
  name: "Adaga Rápida",
  rarity: "rare",
  equipableType: "role",
  equipableTarget: "dps",
  bonusAttack: 60,
  bonusSpeed: 40,
  // Sem passiva
}
```

### 🛡️ Classe - Tank (Passiva Opcional)

```typescript
// Lendário COM passiva
{
  name: "Escudo Indestrutível",
  rarity: "legendary",
  equipableType: "role",
  equipableTarget: "tank",
  bonusHp: 200,
  bonusDefense: 120,
  passiveAbility: {
    id: "unbreakable",
    name: "Indestrutível",
    description: "Ao receber dano fatal, sobrevive com 1 HP (1x por batalha)",
  }
}
```

### 🌟 Universal (Passiva Rara)

```typescript
// Mítico COM passiva
{
  name: "Anel do Destino",
  rarity: "mythic",
  equipableType: "universal",
  bonusHp: 100,
  bonusAttack: 80,
  bonusDefense: 80,
  bonusSpeed: 40,
  passiveAbility: {
    id: "fate",
    name: "Destino",
    description: "10% de chance de ressuscitar ao morrer com 50% HP",
  }
}

// Épico SEM passiva
{
  name: "Colar de Energia",
  rarity: "epic",
  equipableType: "universal",
  bonusHp: 80,
  bonusAttack: 50,
  bonusDefense: 50,
  // Sem passiva
}
```

## 🔧 Integração com Batalha

### Como os stats funcionam:
```typescript
// Stats finais do personagem em batalha:
finalStats = {
  hp: baseHp + (level * 40) + (masteryBonus) + (equipmentBonusHp || 0),
  attack: baseAttack + (level * 8) + (masteryBonus) + (equipmentBonusAttack || 0),
  defense: baseDefense + (level * 5) + (masteryBonus) + (equipmentBonusDefense || 0),
  speed: baseSpeed + (masteryBonus) + (equipmentBonusSpeed || 0),
  critChance: 15 + (equipmentBonusCritChance || 0),
  critDamage: 1.5 + (equipmentBonusCritDamage || 0),
}

// Passivas:
passives = [
  characterPassive,           // Passiva base do personagem
  equipmentPassive || null    // Passiva do equipamento (se tiver)
].filter(Boolean);
```

## 📦 Schema de Banco de Dados

```sql
-- Tabela de equipamentos (catálogo)
CREATE TABLE equipment (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL, -- common, uncommon, rare, epic, legendary, mythic
  description TEXT,
  equipable_type TEXT NOT NULL, -- character, role, universal
  equipable_target TEXT, -- nome do personagem ou role
  bonus_hp INTEGER DEFAULT 0,
  bonus_attack INTEGER DEFAULT 0,
  bonus_defense INTEGER DEFAULT 0,
  bonus_speed INTEGER DEFAULT 0,
  bonus_crit_chance INTEGER DEFAULT 0,
  bonus_crit_damage NUMERIC DEFAULT 0,
  passive_ability JSONB, -- PassiveAbility opcional
  image_url TEXT,
  catalog_managed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de equipamentos do usuário
CREATE TABLE user_equipment (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE RESTRICT,
  acquired_at TIMESTAMP DEFAULT NOW()
);

-- Relação: qual equipamento está equipado em qual personagem
CREATE TABLE character_equipped (
  user_character_id UUID PRIMARY KEY REFERENCES user_characters(id) ON DELETE CASCADE,
  user_equipment_id UUID UNIQUE REFERENCES user_equipment(id) ON DELETE SET NULL
);
```

## 🎮 Comandos

```
/equipamento <personagem> <equipamento>  - Equipa item no personagem
/equipamento <personagem> remover        - Remove equipamento
/equipamentos                            - Lista seus equipamentos
/personagem <nome>                       - Mostra equipamento equipado
```

## 🎁 Como Conseguir Equipamentos

1. **Drops de batalha** (PvE/Arena)
2. **Loja** (comprar com Gold/Gemas)
3. **Eventos** (recompensas especiais)
4. **Crafting** (sistema futuro)
5. **Gacha de equipamentos** (banner especial)

## 🌟 Passivas de Equipamento (Exemplos)

### Para Personagens Específicos:
- **Bandana do Zoro:** Ataque triplo ocasional
- **Venda do Gojo:** Geração de carga aumentada
- **Colar do Naruto:** Transformação em baixo HP
- **Sharingan do Sasuke:** Cópia de habilidades
- **Marca do Meliodas:** Counter damage aumentado

### Para Classes:
- **DPS:** Crítico aumentado, lifesteal, penetração
- **Tank:** Shield automático, regen, resistência
- **Support:** Buffs AOE, regen aliados, carga aumentada
- **Control:** Debuff duration+, chance aumentada, slow
- **Healer:** Cura aumentada, cleanse, ressurreição

### Universal:
- **Ressurreição:** 10% chance de reviver
- **Lucky:** +10% drops, +10% gold
- **Vampírico:** 10% lifesteal
- **Crítico:** +15% crit chance

## ✅ Próximos Passos de Implementação

1. ✅ Criar schema no banco (equipment, user_equipment, character_equipped)
2. ✅ Criar migration
3. ✅ Criar seed de equipamentos iniciais
4. ✅ Atualizar BattleService para aplicar bonus de equipamento
5. ✅ Atualizar embeds para mostrar equipamento
6. ✅ Criar comando `/equipamento`
7. ✅ Integrar drops de equipamento em batalhas
8. ✅ Adicionar passivas de equipamento ao combate

Esse sistema será implementado agora! 🚀
