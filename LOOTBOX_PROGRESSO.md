# 🎁 Sistema de Loot Box - Progresso da Implementação

## ✅ Completado:

### 1. Schema do Banco de Dados ✅
**Arquivo:** `lib/db/src/schema/index.ts`

**Tabelas Criadas:**
```typescript
- loot_box_openings: Histórico de aberturas
  - id, user_id, box_type, gems_spent, rewards, jackpot, opened_at

- loot_box_pity: Sistema de garantia progressiva
  - user_id, box_type, counter, last_rare_at

- daily_free_box: Caixa grátis diária
  - id, user_id, last_claimed_at

- Enum: loot_box_type (basic, advanced, epic, legendary, mythic)
```

### 2. LootBoxService Completo ✅
**Arquivo:** `artifacts/api-server/src/services/LootBoxService.ts`

**Funcionalidades:**
- ✅ `openLootBox()` - Abre loot box com gemas
- ✅ `generateReward()` - Gera recompensas aleatórias
- ✅ `generateEquipmentReward()` - Equipamentos por raridade
- ✅ `applyRewards()` - Aplica recompensas ao usuário
- ✅ Sistema de Pity (Soft 5x, Hard 10x)
- ✅ `calculatePityBonus()` - Calcula bonus de garantia
- ✅ `getHistory()` - Histórico de aberturas
- ✅ `getStats()` - Estatísticas completas
- ✅ `claimDailyFreeBox()` - Caixa grátis diária
- ✅ Jackpot (0.1% chance de dobrar recompensas)

**Pools de Recompensas Configurados:**
| Caixa | Preço | Recompensas | Conteúdo |
|-------|-------|-------------|----------|
| Básica | 50💎 | 3x | Gold, Tickets, Equipment Common/Uncommon, XP |
| Avançada | 150💎 | 5x | Gold, Tickets, Equipment Uncommon/Rare, XP, Gems |
| Épica | 400💎 | 7x | Gold, Tickets, Equipment Rare/Epic, XP, Gems, Characters |
| Lendária | 1000💎 | 10x | Gold, Tickets, Equipment Epic/Legendary, XP, Gems, Characters, Specials |
| Mítica | 2500💎 | 15x | Gold, Tickets, Equipment Legendary/Mythic, XP Alto, Gems, Characters Legendários |

### 3. Embeds Profissionais ✅
**Arquivo:** `artifacts/api-server/src/bot/embeds.ts`

**Embeds Criados:**
- ✅ `createLootBoxShopEmbed()` - Loja com todas as caixas, preços e pity
- ✅ `createLootBoxOpeningEmbed()` - Resultado da abertura com animação
- ✅ `createLootBoxHistoryEmbed()` - Histórico e estatísticas
- ✅ `createDailyFreeBoxEmbed()` - Confirmação de caixa grátis

**Features dos Embeds:**
- Emojis por raridade de equipamento
- Agrupamento inteligente de recompensas
- Indicador de Jackpot
- Indicador de Pity ativado
- Formatação de tempo relativo
- Melhores items destacados

### 4. Comandos Criados ✅
**Arquivo:** `artifacts/api-server/src/bot/commands.ts`

**Comandos:**
```
/loja
- Abre loja de loot boxes
- Mostra todos os tipos, preços e pity counters

/lootbox abrir <tipo> [quantidade]
- Abre 1-10 loot boxes
- 5 tipos: básica, avançada, épica, lendária, mítica

/lootbox historico
- Ver últimas 20 aberturas
- Estatísticas completas

/lootbox diaria
- Reivindica caixa grátis diária (Caixa Básica)
- Reseta às 00:00 UTC

/lootbox aplicar-xp <personagem>
- Aplica XP de Maestria acumulado
- Escolhe personagem da equipe
```

---

## 🔄 Próximos Passos:

### 5. Handlers dos Comandos ⏳
**Arquivo:** `artifacts/api-server/src/bot/handlers.ts`

**Precisa implementar:**
- Handler de `/loja`
- Handler de `/lootbox abrir`
- Handler de `/lootbox historico`
- Handler de `/lootbox diaria`
- Handler de `/lootbox aplicar-xp`
- Autocomplete para `/lootbox aplicar-xp`

### 6. Sistema de XP de Maestria Acumulado ⏳
**Novo conceito:**
- Loot boxes dropam XP de Maestria
- XP fica "guardado" no inventário do usuário
- Usuário escolhe qual personagem recebe o XP
- Pode aplicar tudo de uma vez

**Implementação necessária:**
```typescript
// Tabela no schema
mastery_xp_inventory:
  - user_id: UUID (PK)
  - accumulated_xp: INTEGER

// Funções no service
- accumulateMasteryXp(userId, amount)
- applyMasteryXpToCharacter(userId, characterId, amount)
- getMasteryXpBalance(userId)
```

### 7. Gerar Migration ⏳
```bash
cd lib/db
pnpm drizzle-kit generate
pnpm run migrate
```

### 8. Testar Sistema ⏳
- Comprar loot boxes
- Abrir múltiplas caixas
- Verificar pity system
- Testar jackpot
- Reivind icar caixa grátis
- Aplicar XP de maestria

---

## 📊 Mecânicas Implementadas:

### ✅ Sistema de Pity
- Soft Pity: 5 caixas sem item raro = +20% chance
- Hard Pity: 10 caixas sem item raro = Garantia de item raro
- Contador separado por tipo de caixa
- Reset ao obter item raro

### ✅ Sistema de Jackpot
- 0.1% de chance em qualquer caixa
- **Dobra todas as recompensas**
- Visual especial no embed

### ✅ Caixa Grátis Diária
- 1 Caixa Básica grátis por dia
- Reseta às 00:00 UTC (24h)
- Não conta para pity

### ✅ Pools de Recompensas
- Peso configurável por tipo de recompensa
- Raridades específicas por caixa
- Ranges de valores configuráveis
- Garantias de valor mínimo

### ✅ Histórico e Estatísticas
- Últimas 20 aberturas salvas
- Total de caixas abertas
- Total de gemas gastas
- Contagem de jackpots
- Melhores drops destacados

---

## 🎮 Como Funciona:

### Fluxo de Abertura:
```
1. Usuário compra caixa com /lootbox abrir
2. Sistema verifica gemas
3. Deduz gemas do usuário
4. Verifica contador de pity
5. Gera X recompensas baseado no pool
6. Aplica bonus de pity se aplicável
7. Verifica jackpot (0.1%)
8. Aplica recompensas:
   - Gold/Tickets/Gems → Instantâneo
   - Equipamentos → user_equipment
   - XP Maestria → Inventário (aplicar depois)
9. Salva abertura no histórico
10. Atualiza contador de pity
11. Mostra embed com resultados
```

### Exemplo de Uso:
```
> /loja
[Mostra loja com 5 tipos de caixas e pity counters]

> /lootbox abrir tipo:Épica
[Deduz 400 gemas]
[Gera 7 recompensas]
[Mostra: 1200 Gold, 8 Tickets, Katana Afiada [Epic], 500 XP]

> /lootbox aplicar-xp personagem:Naruto
[Aplica 500 XP de Maestria em Naruto]
[Naruto subiu para Maestria Lv 7!]

> /lootbox historico
[Mostra últimas 20 aberturas e stats]
```

---

## 💎 Sistema de Preços e Pacotes:

### Preços Individuais:
- Básica: 50💎
- Avançada: 150💎
- Épica: 400💎
- Lendária: 1000💎
- Mítica: 2500💎

### Pacotes (Futuro):
- Pack 3: 20% OFF
- Pack 10: 30% OFF
- First Purchase: Dobro de recompensas

---

## 🔮 Features Especiais (Futuro):

### Luck Streak:
- 5 aberturas consecutivas: +5% raridade
- 10 aberturas: +10%
- 20 aberturas: +15%

### Mystery Box:
- Aparece 1x/semana
- 500 Gemas
- Recompensas completamente aleatórias

### Happy Hour:
- 2 horas por dia
- +50% recompensas

### Itens Especiais:
- Fragmento de Personagem (10 = 1 personagem Epic)
- Poção de XP (+500 XP)
- Talismã de Sorte (+10% chance)
- Chave Dourada (Caixa Secreta)

---

## 📝 Status Atual:

✅ **Schema:** 100%
✅ **Service:** 100%
✅ **Embeds:** 100%
✅ **Comandos:** 100%
⏳ **Handlers:** 0% (Próximo passo)
⏳ **XP Acumulado:** 0% (Precisa implementar)
⏳ **Migration:** 0% (Depois dos handlers)

---

Pronto para continuar com os handlers! 🚀
