# 🔮 Sistema de Passivas Avançado

## Visão Geral

O sistema de passivas permite criar habilidades automáticas complexas que são executadas durante batalhas em resposta a eventos específicos. Cada passiva é composta por:

- **Trigger**: Quando a passiva deve ativar
- **Condições**: Requisitos que devem ser atendidos
- **Efeitos**: O que acontece quando ativa

## 📋 Estrutura de uma Passiva

```typescript
{
  id: "identificador_unico",
  name: "Nome da Passiva",
  description: "Descrição legível",
  trigger: "on_hit",              // Quando ativa
  conditions: [...],               // Condições opcionais
  effects: [...],                  // Efeitos aplicados
  maxActivationsPerBattle: 3,     // Limite por batalha (opcional)
  maxActivationsPerRound: 1,      // Limite por rodada (opcional)
  cooldownRounds: 2,              // Cooldown em rodadas (opcional)
  priority: 10                     // Prioridade de execução (opcional)
}
```

## 🎯 Triggers Disponíveis

### Triggers de Combate
```typescript
"on_battle_start"    // Início da batalha (1x)
"on_round_start"     // Início de cada rodada
"on_turn_start"      // Início do turno do personagem
"on_turn_end"        // Fim do turno do personagem
```

### Triggers de Ataque
```typescript
"on_basic_attack"    // Ao usar ataque básico
"on_skill_use"       // Ao usar qualquer skill
"on_ultimate_use"    // Ao usar ultimate
"on_hit"             // Ao acertar qualquer ataque
"on_critical_hit"    // Ao dar crítico
"on_kill"            // Ao derrotar inimigo
```

### Triggers Defensivos
```typescript
"on_damaged"         // Ao receber dano
"on_hit_taken"       // Ao ser atingido
"on_critical_taken"  // Ao receber crítico
```

### Triggers de HP
```typescript
"on_hp_below_threshold"  // HP cai abaixo de X%
"on_hp_above_threshold"  // HP acima de X%
"on_low_hp"              // HP < 30%
"on_near_death"          // HP < 10%
```

### Triggers de Status
```typescript
"on_status_applied"      // Ao aplicar status
"on_status_received"     // Ao receber status
"on_buff_gained"         // Ao ganhar buff
"on_debuff_received"     // Ao receber debuff
```

### Triggers de Aliados/Inimigos
```typescript
"on_ally_defeated"   // Aliado morre
"on_ally_healed"     // Aliado é curado
"on_ally_low_hp"     // Aliado com HP baixo
"on_enemy_defeated"  // Inimigo morre
"on_enemy_low_hp"    // Inimigo com HP baixo
```

### Triggers Especiais
```typescript
"always"             // Sempre ativo (passivo permanente)
"on_death"           // Ao morrer (antes de morrer)
"on_revive"          // Ao ser revivido
```

## ✅ Condições Disponíveis

### Condições de HP
```typescript
{ type: "hp_below_percent", value: 50 }        // Próprio HP < 50%
{ type: "hp_above_percent", value: 75 }        // Próprio HP > 75%
{ type: "target_hp_below_percent", value: 30 } // HP do alvo < 30%
{ type: "target_hp_above_percent", value: 50 } // HP do alvo > 50%
```

### Condições de Status
```typescript
{ type: "has_status", statusType: "burn" }           // Tem queimadura
{ type: "has_buff" }                                  // Tem qualquer buff
{ type: "has_debuff" }                                // Tem qualquer debuff
{ type: "target_has_status", statusType: "poison" }  // Alvo envenenado
{ type: "status_count_above", value: 3 }             // Mais de 3 status
```

### Condições de Combate
```typescript
{ type: "is_critical" }                // Foi crítico
{ type: "damage_above", value: 500 }   // Dano > 500
{ type: "damage_below", value: 100 }   // Dano < 100
{ type: "first_hit" }                  // Primeiro hit da batalha
```

### Condições de Equipe
```typescript
{ type: "allies_alive_below", value: 2 }    // Menos de 2 aliados vivos
{ type: "enemies_alive_below", value: 3 }   // Menos de 3 inimigos vivos
{ type: "is_last_standing" }                 // Último aliado vivo
```

### Condições de Rodada
```typescript
{ type: "round_above", value: 5 }    // Após rodada 5
{ type: "round_below", value: 3 }    // Antes da rodada 3
{ type: "is_first_round" }           // Primeira rodada
```

### Condições de Chance
```typescript
{ type: "random_chance", value: 30 }  // 30% de chance
```

## 💥 Efeitos Disponíveis

### Efeitos de Stats (Permanentes na Batalha)
```typescript
{ type: "increase_attack", value: 50, target: "self" }
{ type: "increase_defense", value: 30, target: "self" }
{ type: "increase_speed", value: 20, target: "self" }
{ type: "increase_hp", value: 200, target: "self" }
{ type: "increase_crit_chance", value: 15, target: "self" }
{ type: "increase_crit_damage", value: 40, target: "self" }
```

### Efeitos de Dano
```typescript
{ type: "bonus_damage", value: 200, target: "target" }
{ type: "bonus_damage_percent", value: 50, target: "self" }
{ type: "reflect_damage", value: 30, target: "attacker" }    // Reflete 30%
{ type: "lifesteal", value: 20, target: "self" }             // Cura 20% do dano
```

### Efeitos de Cura
```typescript
{ type: "heal_self", value: 300, target: "self" }
{ type: "heal_percent", value: 10, target: "self" }          // Cura 10% HP máx
{ type: "heal_ally", value: 200, target: "lowest_hp_ally" }
{ type: "regeneration", value: 50, duration: 3, target: "self" }
```

### Efeitos de Status
```typescript
{
  type: "apply_status",
  value: 50,                    // Valor do status
  duration: 3,                  // Duração em turnos
  statusType: "burn",           // Tipo de status
  chance: 70,                   // 70% de chance (opcional)
  target: "target"
}

{ type: "cleanse_debuff", value: 2, target: "self" }  // Remove 2 debuffs
{ type: "remove_status", statusType: "poison", target: "self" }
```

### Efeitos de Proteção
```typescript
{ type: "damage_reduction", value: 30, target: "self" }      // Reduz 30%
{ type: "shield", value: 400, duration: 2, target: "self" }
{ type: "prevent_death", value: 15, target: "self" }         // Sobrevive com 15% HP
```

### Efeitos de Energia/Carga
```typescript
{ type: "gain_energy", value: 20, target: "self" }
{ type: "gain_ultimate_charge", value: 15, target: "self" }
{ type: "reduce_cooldown", value: 1, target: "self" }
{ type: "reset_skill", target: "self" }
```

### Efeitos de Controle
```typescript
{ type: "stun_attacker", duration: 1, target: "attacker" }
{ type: "counter_attack", value: 100, target: "attacker" }   // % do ataque
{ type: "retaliate", value: 150, target: "attacker" }
```

### Efeitos Especiais
```typescript
{ type: "execute_low_hp", value: 20, target: "target" }      // Executa se HP < 20%
{ type: "dispel_buffs", value: 2, target: "target" }         // Remove 2 buffs
{ type: "steal_buff", target: "target" }
{ type: "chain_to_enemy", value: 50, target: "random_enemy" }
```

## 🎯 Alvos (target)

```typescript
"self"              // O próprio personagem
"attacker"          // Quem atacou
"target"            // Alvo do ataque
"allies"            // Todos os aliados vivos
"enemies"           // Todos os inimigos vivos
"all"               // Todos os combatentes
"random_enemy"      // Inimigo aleatório
"random_ally"       // Aliado aleatório
"lowest_hp_ally"    // Aliado com menor HP
"lowest_hp_enemy"   // Inimigo com menor HP
```

## 📚 Exemplos Práticos

### 1. Passiva Ofensiva Simples

**Fúria Berserker** - Ganha ataque quando HP baixo:

```typescript
{
  id: "berserker_rage",
  name: "Fúria Berserker",
  description: "Ganha 30% de ataque quando HP está abaixo de 50%",
  trigger: "on_hp_below_threshold",
  conditions: [
    { type: "hp_below_percent", value: 50 }
  ],
  effects: [
    { type: "increase_attack", value: 30, target: "self" }
  ],
  maxActivationsPerBattle: 1
}
```

### 2. Passiva Defensiva com Reflexo

**Espinhos** - Reflete dano:

```typescript
{
  id: "thorns",
  name: "Espinhos",
  description: "Reflete 30% do dano recebido de volta ao atacante",
  trigger: "on_damaged",
  effects: [
    { type: "reflect_damage", value: 30, target: "attacker" }
  ]
}
```

### 3. Passiva de Cura Condicional

**Anjo Guardião** - Cura aliado em perigo:

```typescript
{
  id: "guardian_angel",
  name: "Anjo Guardião",
  description: "Quando um aliado tem HP abaixo de 30%, cura 200 HP",
  trigger: "on_ally_low_hp",
  conditions: [
    { type: "target_hp_below_percent", value: 30 }
  ],
  effects: [
    { type: "heal_self", value: 200, target: "lowest_hp_ally" }
  ],
  maxActivationsPerRound: 1
}
```

### 4. Passiva com Chance

**Pressão Espiritual** - Dano extra com chance:

```typescript
{
  id: "spiritual_pressure",
  name: "Pressão Espiritual",
  description: "30% de chance de causar 20% de dano adicional",
  trigger: "on_hit",
  effects: [
    {
      type: "bonus_damage_percent",
      value: 20,
      chance: 30,
      target: "self"
    }
  ]
}
```

### 5. Passiva Complexa Multi-Efeito

**Sharingan** - Múltiplos buffs:

```typescript
{
  id: "sharingan",
  name: "Sharingan",
  description: "Aumenta chance de crítico em 15% e dano crítico em 30%",
  trigger: "on_battle_start",
  effects: [
    { type: "increase_crit_chance", value: 15, target: "self" },
    { type: "increase_crit_damage", value: 30, target: "self" }
  ]
}
```

### 6. Passiva com Múltiplas Condições

**Executor Mortal** - Dano extra contra alvos fracos:

```typescript
{
  id: "deadly_executioner",
  name: "Executor Mortal",
  description: "Causa 60% de dano extra em inimigos com HP < 30% quando é crítico",
  trigger: "on_hit",
  conditions: [
    { type: "is_critical" },
    { type: "target_hp_below_percent", value: 30 }
  ],
  effects: [
    { type: "bonus_damage_percent", value: 60, target: "self" }
  ]
}
```

### 7. Passiva de Sobrevivência

**Vontade de Ferro** - Sobrevive a morte letal:

```typescript
{
  id: "iron_will",
  name: "Vontade de Ferro",
  description: "Sobrevive com 1 HP ao receber dano letal (1x por batalha)",
  trigger: "on_damaged",
  conditions: [
    { type: "hp_below_percent", value: 1 }
  ],
  effects: [
    { type: "prevent_death", value: 1, target: "self" }
  ],
  maxActivationsPerBattle: 1
}
```

### 8. Passiva de Suporte em Área

**Cura em Equipe** - Regeneração para todos:

```typescript
{
  id: "team_heal",
  name: "Cura em Equipe",
  description: "No início de cada rodada, cura todos os aliados em 3% do HP máximo",
  trigger: "on_round_start",
  effects: [
    { type: "heal_percent", value: 3, target: "allies" }
  ]
}
```

### 9. Passiva de Vampirismo

**Sede de Sangue** - Lifesteal e buff:

```typescript
{
  id: "bloodthirst",
  name: "Sede de Sangue",
  description: "Cura 25% do dano causado e ganha ataque ao matar",
  trigger: "on_hit",
  effects: [
    { type: "lifesteal", value: 25, target: "self" }
  ]
},
{
  id: "bloodlust",
  name: "Fúria Sanguinária",
  description: "Ao derrotar inimigo, ganha 40% ataque por 2 turnos",
  trigger: "on_kill",
  effects: [
    {
      type: "apply_status",
      value: 40,
      duration: 2,
      statusType: "attack_up",
      target: "self"
    }
  ]
}
```

### 10. Passiva de Boss

**Enraivecer** - Fica mais forte com tempo:

```typescript
{
  id: "enrage",
  name: "Enfurecer",
  description: "Após rodada 5, ganha 60% ataque e 30% velocidade permanente",
  trigger: "on_round_start",
  conditions: [
    { type: "round_above", value: 5 }
  ],
  effects: [
    {
      type: "apply_status",
      value: 60,
      duration: 99,
      statusType: "attack_up",
      target: "self"
    },
    {
      type: "apply_status",
      value: 30,
      duration: 99,
      statusType: "speed_up",
      target: "self"
    }
  ],
  maxActivationsPerBattle: 1,
  priority: 100  // Alta prioridade
}
```

## 🎨 Como Adicionar Passiva a um Personagem

### Opção 1: Usar Passiva da Biblioteca

```typescript
import { SHARINGAN, DETERMINATION } from "./passive-library";

{
  anime: "Naruto",
  name: "Sasuke Uchiha",
  // ... outros campos ...
  passive: "Sharingan: aumenta crítico",
  passiveAbility: SHARINGAN,
  // ...
}
```

### Opção 2: Criar Passiva Customizada

```typescript
{
  anime: "My Hero Academia",
  name: "All Might",
  // ... outros campos ...
  passive: "One For All: poder absoluto",
  passiveAbility: {
    id: "one_for_all",
    name: "One For All",
    description: "Aumenta todos os stats drasticamente no início da batalha",
    trigger: "on_battle_start",
    effects: [
      { type: "increase_attack", value: 100, target: "self" },
      { type: "increase_defense", value: 50, target: "self" },
      { type: "increase_speed", value: 40, target: "self" },
      { type: "increase_hp", value: 500, target: "self" }
    ]
  },
  // ...
}
```

### Opção 3: Criar Variante de Passiva Existente

```typescript
import { createPassiveVariant } from "./passive-library";

const SUPER_BERSERKER = createPassiveVariant("berserker_rage", {
  id: "super_berserker",
  name: "Super Berserker",
  description: "Ganha 50% ataque quando HP < 50%",
  effects: [
    { type: "increase_attack", value: 50, target: "self" }
  ]
});
```

## 🎯 Dicas e Melhores Práticas

### ✅ Faça

1. **Use triggers específicos** - Mais eficiente que `"always"`
2. **Adicione limites** - `maxActivationsPerBattle` previne abuso
3. **Teste em batalha** - Verifique se funciona como esperado
4. **Balance valores** - 20-50% de bônus é geralmente bom
5. **Use condições** - Torna passivas mais interessantes
6. **Combine efeitos** - Passivas multi-efeito são poderosas

### ❌ Evite

1. **Valores muito altos** - 200% de ataque quebra o jogo
2. **Triggers muito frequentes** sem limites
3. **Passivas sem contrapartida** - Todo poder tem custo
4. **Efeitos permanentes** muito fortes
5. **Múltiplas passivas iguais** - Causa stacking excessivo

## 📊 Tabela de Balanceamento

| Tipo de Efeito | Valor Sugerido | Observações |
|----------------|----------------|-------------|
| Aumento de Ataque | 20-50% | 30% é padrão |
| Aumento de Defesa | 20-40% | Defensivo é mais forte |
| Aumento de Velocidade | 10-30 pontos | Impacto na ordem |
| Dano Bônus | 15-40% | Depende da condição |
| Cura | 5-15% HP máx | Por turno/rodada |
| Lifesteal | 15-30% | Muito forte se > 30% |
| Reflexo de Dano | 20-40% | Não deve matar sozinho |
| Chance de Crítico | 10-20% | Base já existe |
| Escudo | 200-500 HP | Depende do HP total |
| Carga de Ultimate | 5-20 | Max 100-150 geralmente |

## 🔍 Debugging e Testes

### Ver passivas em ação

As passivas são executadas automaticamente e registradas nos logs de batalha. Para debug:

1. Verifique o console durante batalhas
2. Passivas ativadas aparecem nos actions
3. Efeitos modificam stats em tempo real

### Testar passiva

```typescript
// Crie personagem de teste com passiva
const testChar = {
  // ... stats básicos ...
  passiveAbility: YOUR_PASSIVE
};

// Execute batalha
// Observe logs e comportamento
```

## 🚀 Passivas Avançadas

### Passiva com Prioridade

```typescript
{
  id: "priority_passive",
  // ...
  priority: 100  // Executa antes de outras (padrão: 0)
}
```

### Passiva com Cooldown

```typescript
{
  id: "cooldown_passive",
  // ...
  cooldownRounds: 3  // 3 rodadas de espera após ativar
}
```

### Passiva com Múltiplos Limites

```typescript
{
  id: "limited_passive",
  // ...
  maxActivationsPerBattle: 3,  // Máx 3x na batalha
  maxActivationsPerRound: 1,   // Máx 1x por rodada
  cooldownRounds: 2            // 2 rodadas entre ativações
}
```

## 📖 Referência Rápida

### Status Types
```
burn, shock, freeze, stun, poison, bleed,
shield, attack_up, attack_down, defense_up,
defense_down, speed_up, speed_down
```

### Roles
```
tank, dps, support, healer, control
```

---

**Dúvidas?** Veja os exemplos em `lib/db/src/data/passive-library.ts` com 35+ passivas prontas para usar!

**Próximo:** Adicione sua primeira passiva customizada! 🎮
