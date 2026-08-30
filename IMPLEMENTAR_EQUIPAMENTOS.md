# 🚀 Implementação do Sistema de Equipamentos

## ✅ Design Completo Criado

O documento `SISTEMA_EQUIPAMENTOS.md` contém o design completo do sistema com:

### 📋 Características Principais:
- ✅ **1 equipamento por personagem**
- ✅ **Stats fixos** (sem RNG)
- ✅ **3 tipos de equipável:**
  - Personagem específico (sempre tem passiva)
  - Classe/Role (passiva opcional)
  - Universal (passiva rara)
- ✅ **Raridades:** Common → Mythic
- ✅ **Segunda passiva** do personagem

## 📊 Próximos Passos

### 1. Schema do Banco de Dados
Adicionar ao `lib/db/src/schema/index.ts`:
```typescript
// Tabela equipment (catálogo)
// Tabela user_equipment (inventário)
// Tabela character_equipped (equipado)
```

### 2. Migration
```bash
cd lib/db
pnpm drizzle-kit generate
pnpm run migrate
```

### 3. Seed de Equipamentos Iniciais
Criar `lib/db/src/data/equipment.ts` com:
- Bandana do Zoro
- Venda do Gojo
- Colar do Naruto
- Equipamentos de classe
- Equipamentos universais

### 4. Atualizar Motores de Batalha
Modificar:
- `BattleService.ts` - Aplicar bonus de equipamento
- `AdaptivePvpService.ts` - Aplicar bonus de equipamento
- `SkillManager.ts` - Incluir passiva de equipamento

### 5. Service de Equipamento
Criar `EquipmentService.ts`:
- `equipItem(userCharacterId, userEquipmentId)`
- `unequipItem(userCharacterId)`
- `listUserEquipment(userId)`
- `getEquippedItem(userCharacterId)`

### 6. Comandos Discord
Adicionar ao `commands.ts`:
```typescript
/equipamento <personagem> <item>
/equipamento <personagem> remover
/equipamentos
```

### 7. Atualizar Embeds
- `/personagem` - Mostrar equipamento equipado
- `/equipe` - Mostrar equipamentos da equipe
- Batalha - Aplicar visuais de equipamento

### 8. Sistema de Drops
Integrar drops de equipamento em:
- PvE battles
- Arena PvP
- Boss fights

## 🎮 Como Vai Funcionar

### Equipar:
```
/equipamento Gojo "Venda dos Seis Olhos"
✅ Venda dos Seis Olhos equipada em Satoru Gojo!
+50 SPD, +20% CRIT
Passiva: Seis Olhos - Ganha +30 de carga por turno
```

### Ver Equipamento:
```
/personagem Gojo

Satoru Gojo [Raro Control]
HP: 950 (+50) | ATK: 175 | DEF: 100 | SPD: 140 (+50)
CRIT: 15% (+20%) | Maestria: Lv 5

⚡ Equipamento: Venda dos Seis Olhos [Mítico]
└─ +50 SPD, +20% CRIT
└─ 👁️ Passiva: Seis Olhos

Passiva Base: Infinito (40% evasão)
Passiva Equipamento: Seis Olhos (+30 carga/turno)
```

### Em Batalha:
- Stats aplicados automaticamente
- 2 passivas ativas simultaneamente
- Visual mostra equipamento

## 📦 Estrutura de Arquivos

```
lib/db/src/
├── schema/index.ts          # +equipment tables
├── data/
│   ├── equipment.ts         # NEW - Catálogo de equipamentos
│   └── passive-library.ts   # +Equipment passives

artifacts/api-server/src/
├── services/
│   ├── EquipmentService.ts  # NEW
│   ├── BattleService.ts     # MODIFICAR
│   └── AdaptivePvpService.ts # MODIFICAR
├── bot/
│   ├── commands.ts          # +/equipamento
│   ├── handlers.ts          # +equipment handlers
│   └── embeds.ts            # +equipment embeds
```

## 🎯 Ordem de Implementação

1. Schema + Migration (Base de dados)
2. Equipment catalog (Dados)
3. EquipmentService (Lógica)
4. Battle integration (Combate)
5. Commands (Interface)
6. Drops system (Recompensas)

## ⏰ Status: IMPLEMENTAÇÃO EM PROGRESSO

### ✅ Completo:
1. ✅ Schema do banco de dados (`lib/db/src/schema/index.ts`)
   - equipment table (catálogo)
   - user_equipment table (inventário)
   - character_equipped table (equipado)
2. ✅ Catálogo de equipamentos (`lib/db/src/data/equipment.ts`)
   - 8 equipamentos de personagem específico (Zoro, Gojo, Naruto, etc)
   - 10 equipamentos de classe (DPS, Tank, Healer, Control, Support)
   - 5 equipamentos universais
3. ✅ Script de seed (`lib/db/scripts/seed-equipment.mjs`)
4. ✅ EquipmentService (`artifacts/api-server/src/services/EquipmentService.ts`)

### 🔄 Próximo:
5. Gerar migration: `cd lib/db; pnpm drizzle-kit generate; pnpm run migrate`
6. Atualizar BattleService e AdaptivePvpService
7. Criar comandos `/equipamento`
8. Atualizar embeds

### ⏭️ Sistema Futuro (NÃO implementar agora):
- ❌ Drops de batalha
- ❌ Loja de equipamentos
- ❌ Gacha de equipamentos
- ❌ Crafting
