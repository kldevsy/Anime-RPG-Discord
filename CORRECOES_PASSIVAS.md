# 🔧 Correções de Passivas - Validação Zod

## ❌ Erros Encontrados:

### 1. **Targets inválidos:**
- ❌ `all_enemies` → ✅ `enemies`
- ❌ `all_allies` → ✅ `allies`
- ❌ `next_target` → ✅ `target`

### 2. **Campo `value` faltando:**
- Todas as passivas precisam do campo `value` (mesmo que seja 0)

## ✅ Passivas Corrigidas:

### 1. **ANTI_MAGIC** (Asta)
```typescript
// ANTES:
{ type: "remove_buff", chance: 100, target: "target" } // ❌ Sem value

// DEPOIS:
{ type: "remove_buff", value: 1, chance: 100, target: "target" } // ✅
```

### 2. **INFINITY** (Gojo)
```typescript
// ANTES:
{ type: "evade", chance: 40, target: "self" } // ❌ Sem value
{ type: "gain_ultimate_charge", value: 15, target: "self", condition: "evaded" }

// DEPOIS:
{ type: "evade", value: 40, chance: 40, target: "self" } // ✅
{ type: "gain_ultimate_charge", value: 15, target: "self" } // ✅
```

### 3. **MANGEKYO_SHARINGAN** (Itachi)
```typescript
// ANTES:
{ type: "apply_status", statusType: "burn", duration: 4, value: 55, chance: 50, target: "target" }

// DEPOIS:
{ type: "apply_status", value: 55, statusType: "burn", duration: 4, chance: 50, target: "target" } // ✅ value antes de statusType
```

### 4. **PERFECT_SUSANOO_PASSIVE** (Itachi Susanoo)
```typescript
// ANTES:
{ type: "debuff_immunity", value: 100, target: "self", condition: "has_shield" } // ❌ Condition não suportada aqui

// DEPOIS:
{ type: "debuff_immunity", value: 100, target: "self" } // ✅ Removido condition
```

### 5. **SILK_MANIPULATION** (Daki)
```typescript
// ANTES:
{ type: "apply_status", value: 10, duration: 2, statusType: "speed_down", chance: 100, target: "all_enemies" } // ❌ all_enemies

// DEPOIS:
{ type: "apply_status", value: 10, duration: 2, statusType: "speed_down", chance: 100, target: "enemies" } // ✅
```

### 6. **INFINITY_CASTLE** (Nakime)
```typescript
// ANTES:
{ type: "gain_ultimate_charge", value: 15, target: "all_allies" } // ❌ all_allies

// DEPOIS:
{ type: "gain_ultimate_charge", value: 15, target: "allies" } // ✅
```

### 7. **RINNEGAN** (Pain)
```typescript
// ANTES:
stackEffect: { type: "apply_status", statusType: "stun", duration: 1, chance: 100, target: "next_target" } // ❌ Sem value, next_target

// DEPOIS:
stackEffect: { type: "apply_status", value: 0, statusType: "stun", duration: 1, chance: 100, target: "target" } // ✅
```

### 8. **COPY_TECHNIQUE** (Yuta)
```typescript
// ANTES:
{ type: "copy_debuff", chance: 40, target: "attacker" } // ❌ Sem value

// DEPOIS:
{ type: "copy_debuff", value: 1, chance: 40, target: "attacker" } // ✅
```

### 9. **MAHORAGA_ADAPTATION** (Sukuna Mahoraga)
```typescript
// ANTES:
conditionalEffects: [
  { type: "reflect_damage", value: 25, target: "attacker", condition: "resistance_above_40" } // ❌ conditionalEffects não suportado
]

// DEPOIS:
effects: [
  { type: "gain_resistance_to_damage_type", value: 15, target: "self" },
  { type: "reflect_damage", value: 25, chance: 100, target: "attacker" } // ✅ Movido para effects
]
```

## 📋 Valores de Target Válidos (Schema Zod):

```typescript
enum PassiveEffectTarget {
  self         // Aplica em si mesmo
  attacker     // Aplica no atacante
  target       // Aplica no alvo atual
  allies       // Aplica em TODOS os aliados
  enemies      // Aplica em TODOS os inimigos
  all          // Aplica em TODOS (aliados + inimigos)
  random_enemy       // Aplica em um inimigo aleatório
  random_ally        // Aplica em um aliado aleatório
  lowest_hp_ally     // Aplica no aliado com menor HP
  lowest_hp_enemy    // Aplica no inimigo com menor HP
}
```

## 📊 Ordem Correta dos Campos:

Para efeitos com `apply_status`, a ordem correta é:
```typescript
{
  type: "apply_status",
  value: number,           // Valor do status (obrigatório)
  statusType: string,      // Tipo do status
  duration: number,        // Duração
  chance: number,          // Chance de aplicar
  target: string          // Alvo
}
```

## ✅ Status: TODAS AS PASSIVAS CORRIGIDAS!

Agora o seed deve funcionar sem erros de validação Zod.

## 🧪 Para Testar:

```bash
cd ~/workspace
pnpm --filter @workspace/api-server run bot
```

Se aparecer novos erros, verifique:
1. Todos os `effects` têm campo `value`
2. Todos os `target` usam valores válidos do enum
3. Ordem correta dos campos em `apply_status`
4. Não usar `conditionalEffects` (usar apenas `effects`)
5. Não usar `condition` dentro de effects (não suportado pelo schema atual)
