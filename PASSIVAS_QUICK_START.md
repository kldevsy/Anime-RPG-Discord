# ⚡ Passivas - Guia Rápido

## 5 Minutos para Sua Primeira Passiva

### 1️⃣ Escolha uma Passiva da Biblioteca

```typescript
import { DETERMINATION, VAMPIRE, SHARINGAN } from "./passive-library";
```

**Opções Populares:**
- `DETERMINATION` - +25% ataque quando HP < 50%
- `VAMPIRE` - Cura 20% do dano causado
- `SHARINGAN` - +15% crit chance, +30% crit damage
- `REGENERATION` - Cura 5% HP por turno
- `COUNTER_STRIKE` - 40% chance contra-atacar
- `RESILIENCE` - Reduz primeiro dano em 50%

### 2️⃣ Adicione ao Personagem

```typescript
{
  anime: "Seu Anime",
  name: "Seu Personagem",
  rarity: "rare",
  role: "dps",
  // ... stats ...
  passive: "Descrição visual da passiva",
  passiveAbility: DETERMINATION,  // ← Adicione aqui!
  // ... ultimate ...
}
```

### 3️⃣ Teste!

```bash
# Salve o arquivo
# Aguarde auto-sync (~5s)
# Teste no Discord: /batalha-pve
```

**Pronto!** Sua passiva está funcionando! 🎉

---

## Criar Passiva Customizada (Template)

```typescript
passiveAbility: {
  id: "minha_passiva",
  name: "Minha Passiva",
  description: "O que ela faz",
  trigger: "on_hit",  // Quando ativa (ver lista abaixo)
  effects: [
    {
      type: "bonus_damage_percent",  // O que faz (ver lista abaixo)
      value: 30,                      // Quanto
      target: "self"                  // Em quem
    }
  ]
}
```

---

## 🎯 Triggers Mais Usados

```typescript
"on_battle_start"    // Começo da batalha
"on_round_start"     // Cada rodada
"on_turn_start"      // Seu turno
"on_hit"             // Ao acertar
"on_critical_hit"    // Ao dar crítico
"on_damaged"         // Ao receber dano
"on_kill"            // Ao matar
"always"             // Sempre ativo
```

---

## 💥 Efeitos Mais Usados

### Ofensivos
```typescript
{ type: "increase_attack", value: 30, target: "self" }
{ type: "bonus_damage_percent", value: 40, target: "self" }
{ type: "increase_crit_chance", value: 15, target: "self" }
```

### Defensivos
```typescript
{ type: "damage_reduction", value: 25, target: "self" }
{ type: "shield", value: 300, duration: 2, target: "self" }
{ type: "reflect_damage", value: 30, target: "attacker" }
```

### Cura
```typescript
{ type: "heal_percent", value: 5, target: "self" }
{ type: "lifesteal", value: 20, target: "self" }
{ type: "heal_self", value: 200, target: "lowest_hp_ally" }
```

### Ultimate/Energia
```typescript
{ type: "gain_ultimate_charge", value: 10, target: "self" }
{ type: "reduce_cooldown", value: 1, target: "self" }
```

---

## ✅ Condições Úteis

```typescript
conditions: [
  { type: "hp_below_percent", value: 50 },      // HP < 50%
  { type: "is_critical" },                       // Foi crítico
  { type: "target_hp_below_percent", value: 30 } // Alvo HP < 30%
]
```

---

## 🎯 Alvos (target)

```typescript
"self"            // Você mesmo
"target"          // Alvo do ataque
"attacker"        // Quem te atacou
"allies"          // Todos aliados
"enemies"         // Todos inimigos
"lowest_hp_ally"  // Aliado mais fraco
```

---

## 📋 Exemplos Prontos

### DPS Agressivo
```typescript
passiveAbility: {
  id: "aggressive_dps",
  name: "DPS Agressivo",
  description: "Ao dar crítico, próximo ataque causa +50% dano",
  trigger: "on_critical_hit",
  effects: [
    { type: "bonus_damage_percent", value: 50, target: "self" }
  ],
  maxActivationsPerRound: 1
}
```

### Tank Resiliente
```typescript
passiveAbility: {
  id: "resilient_tank",
  name: "Tank Resiliente",
  description: "Reduz todo dano recebido em 20%",
  trigger: "on_damaged",
  effects: [
    { type: "damage_reduction", value: 20, target: "self" }
  ]
}
```

### Healer de Suporte
```typescript
passiveAbility: {
  id: "support_healer",
  name: "Healer de Suporte",
  description: "Cura aliado mais fraco em 150 HP por rodada",
  trigger: "on_round_start",
  effects: [
    { type: "heal_self", value: 150, target: "lowest_hp_ally" }
  ]
}
```

### Assassino Executor
```typescript
passiveAbility: {
  id: "executioner_assassin",
  name: "Assassino Executor",
  description: "40% de dano extra em inimigos com HP < 30%",
  trigger: "on_hit",
  conditions: [
    { type: "target_hp_below_percent", value: 30 }
  ],
  effects: [
    { type: "bonus_damage_percent", value: 40, target: "self" }
  ]
}
```

### Vampiro Regenerador
```typescript
passiveAbility: {
  id: "vampire_regen",
  name: "Vampiro",
  description: "Cura 25% do dano causado",
  trigger: "on_hit",
  effects: [
    { type: "lifesteal", value: 25, target: "self" }
  ]
}
```

---

## 🚫 Erros Comuns

### ❌ Valor muito alto
```typescript
{ type: "increase_attack", value: 500 }  // QUEBRA O JOGO!
```

### ✅ Valor balanceado
```typescript
{ type: "increase_attack", value: 30 }   // Perfeito!
```

### ❌ Sem limite
```typescript
trigger: "on_hit"  // Ativa toda hora sem controle
```

### ✅ Com limite
```typescript
trigger: "on_hit",
maxActivationsPerRound: 1  // Máx 1x por rodada
```

---

## 🎮 Testar Rapidamente

1. **Adicione passiva** ao personagem
2. **Salve** o arquivo
3. **Aguarde** 5 segundos (auto-sync)
4. **Teste** no Discord: `/batalha-pve`
5. **Observe** os logs de batalha

---

## 📚 Mais Informações

- **Guia Completo**: `SISTEMA_PASSIVAS.md`
- **Biblioteca**: `lib/db/src/data/passive-library.ts` (35+ passivas prontas)
- **Exemplos Reais**: Veja personagens em `lib/db/src/data/characters.ts`

---

## 🔥 Top 10 Passivas Mais Usadas

1. **DETERMINATION** - Buff em HP baixo
2. **VAMPIRE** - Lifesteal
3. **SHARINGAN** - Crítico aumentado
4. **REGENERATION** - Cura por turno
5. **COUNTER_STRIKE** - Contra-ataque
6. **RESILIENCE** - Reduz primeiro dano
7. **BATTLE_INSTINCT** - Buff ao sobreviver crítico
8. **CHAKRA_CONTROL** - Cura aliado fraco
9. **THREE_SWORD_STYLE** - Aplica sangramento
10. **SPIRITUAL_PRESSURE** - Dano extra com chance

---

**Pronto para criar?** Copie um template acima e customize! 🚀
