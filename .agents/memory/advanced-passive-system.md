---
name: Sistema Avançado de Passivas
description: Sistema funcional de passivas com triggers, condições e efeitos executados automaticamente durante batalhas
---

## O que foi implementado

Um sistema completo e robusto de passivas que transforma habilidades passivas de strings descritivas em mecânicas funcionais executadas automaticamente durante combate.

## Arquitetura

### 1. Tipos e Schema (PassiveTypes.ts)

- **PassiveTrigger**: 25+ triggers diferentes (on_hit, on_damaged, on_critical_hit, etc)
- **PassiveCondition**: 20+ condições (hp_below_percent, is_critical, target_has_status, etc)
- **PassiveEffect**: 35+ tipos de efeitos (increase_attack, lifesteal, shield, counter_attack, etc)
- **PassiveAbility**: Estrutura completa com trigger, conditions[], effects[]
- **PassiveContext**: Contexto passado para avaliação incluindo owner, target, damage, allies, enemies

### 2. PassiveManager (PassiveManager.ts)

Gerenciador central que:
- Processa triggers específicos
- Avalia condições complexas (AND lógico entre múltiplas condições)
- Executa efeitos nos alvos corretos
- Gerencia limites de ativação (por batalha, por rodada)
- Controla cooldowns
- Mantém estado de ativação por passiva/combatente
- Determina alvos (self, target, allies, enemies, lowest_hp_ally, etc)
- Aplica 35+ tipos de efeitos diferentes

**Efeitos Implementados:**
- Stats: increase_attack, increase_defense, increase_speed, increase_hp, increase_crit_chance/damage
- Dano: bonus_damage, bonus_damage_percent, reflect_damage, lifesteal
- Cura: heal_self, heal_percent, regeneration
- Status: apply_status, cleanse_debuff, remove_status
- Proteção: damage_reduction, shield, prevent_death
- Energia: gain_energy, gain_ultimate_charge, reduce_cooldown
- Controle: stun_attacker, counter_attack, retaliate
- Especiais: execute_low_hp, dispel_buffs, steal_buff

### 3. Integração com BattleEngine

**Pontos de Trigger:**
- `on_battle_start`: Constructor do engine
- `on_round_start`: processRoundStart()
- `on_turn_start`: processRoundStart() para cada unit
- `on_basic_attack`, `on_skill_use`, `on_ultimate_use`: performTurn()
- `on_hit`, `on_critical_hit`: performTurn() após calcular dano
- `on_damaged`, `on_hit_taken`, `on_critical_taken`: performTurn() antes de aplicar dano
- `on_kill`: performTurn() quando HP = 0
- `on_death`, `on_ally_defeated`, `on_enemy_defeated`: checkDeaths()

**Modificação de Dano:**
- Passivas podem modificar `context.modifiedDamage` antes de aplicar
- Atacante modifica com bonus_damage_percent
- Defensor modifica com damage_reduction
- Dano final usa valor modificado

### 4. Biblioteca de Passivas (passive-library.ts)

**35+ passivas predefinidas em categorias:**

**Ofensivas (5):**
- BERSERKER_RAGE: +30% ataque em HP < 50%
- CRITICAL_MASTER: +50% dano no próximo ataque após crítico
- EXECUTIONER: +40% dano em alvos HP < 30%
- COMBO_MASTER: Dano dobrado a cada 3 ataques
- BLOODLUST: +40% ataque por 2 turnos ao matar

**Defensivas (6):**
- IRON_WILL: Sobrevive com 1 HP (1x por batalha)
- LAST_STAND: +50% defesa, +30% ataque quando último vivo
- GUARDIAN_SHIELD: Escudo de 300 HP no início
- DAMAGE_REDUCTION: Reduz dano em 20%
- THORNS: Reflete 30% do dano
- COUNTER_STRIKE: 40% chance de contra-atacar

**Cura/Suporte (5):**
- REGENERATION: Cura 5% HP por turno
- VAMPIRE: Lifesteal de 20%
- GUARDIAN_ANGEL: Cura aliado HP < 30%
- TEAM_HEAL: Cura 3% HP de todos aliados por rodada
- PURIFY: Remove 1 debuff por turno

**Velocidade (3):**
- SWIFT_STRIKE: +30 velocidade inicial
- MOMENTUM: +10 velocidade por hit (máx 3)
- FIRST_STRIKE: +80% dano no primeiro turno

**Energia/Ultimate (3):**
- ENERGY_BATTERY: +5 carga ao receber dano
- QUICK_CHARGE: +15 carga inicial
- COOLDOWN_MASTER: -1 cooldown ao usar skill

**Especiais (10):**
- SHARINGAN: +15% crit chance, +30% crit damage
- BATTLE_INSTINCT: +40% ataque por 2 turnos ao sobreviver crítico
- CHAKRA_CONTROL: Cura aliado mais fraco por rodada
- RESILIENCE: -50% no primeiro dano
- SPIRITUAL_PRESSURE: 30% chance de +20% dano
- DETERMINATION: +25% ataque em HP < 50%
- WATER_BREATHING: +10 velocidade, +15 defesa
- SUPERHUMAN_STRENGTH: +10 carga ao dar crítico
- THREE_SWORD_STYLE: 25% chance sangramento em basic

**Boss (3):**
- ENRAGE: +60% ataque, +30% velocidade após rodada 5
- PHASE_TRANSITION: Limpa debuffs e ganha escudo em HP < 50%
- AOE_PUNISHMENT: 20% chance de 100 dano em área ao ser atacado

### 5. Personagens Atualizados

Todos os 9 personagens iniciais receberam passivas funcionais:
- **Naruto**: DETERMINATION (+25% ataque em HP < 50%)
- **Sakura**: CHAKRA_CONTROL (cura aliado mais fraco)
- **Luffy**: RESILIENCE (reduz primeiro dano 50%)
- **Ichigo**: SPIRITUAL_PRESSURE (30% chance +20% dano)
- **Goku**: BATTLE_INSTINCT (+40% ataque ao sobreviver crítico)
- **Sasuke**: SHARINGAN (+15% crit, +30% crit damage)
- **Zoro**: THREE_SWORD_STYLE (25% sangramento em basic)
- **Tanjiro**: WATER_BREATHING (+10 velocidade, +15 defesa)
- **Yuji**: SUPERHUMAN_STRENGTH (+10 carga ao crítico)

## Schema do Banco de Dados

```typescript
// characters table
passive: text("passive")  // String descritiva (mantida para UI)
passiveAbility: jsonb("passive_ability")  // Estrutura funcional

// Combatant interface
passive?: string
passiveAbility?: PassiveAbility
```

## Como Usar

### Usar passiva da biblioteca:
```typescript
import { VAMPIRE } from "./passive-library";

{
  anime: "Anime",
  name: "Personagem",
  passive: "Vampirismo: cura ao atacar",
  passiveAbility: VAMPIRE,
  // ...
}
```

### Criar passiva customizada:
```typescript
passiveAbility: {
  id: "custom_passive",
  name: "Minha Passiva",
  description: "Descrição",
  trigger: "on_hit",
  conditions: [
    { type: "target_hp_below_percent", value: 30 }
  ],
  effects: [
    { type: "bonus_damage_percent", value: 50, target: "self" }
  ],
  maxActivationsPerBattle: 3
}
```

### Criar variante:
```typescript
import { createPassiveVariant } from "./passive-library";

const SUPER_VAMPIRE = createPassiveVariant("vampire", {
  id: "super_vampire",
  name: "Super Vampiro",
  effects: [
    { type: "lifesteal", value: 35, target: "self" }
  ]
});
```

## Benefícios

1. **Mecânicas Reais**: Passivas executam código, não são só texto
2. **Balanceamento**: Valores numéricos precisos e controláveis
3. **Flexibilidade**: 35+ tipos de efeitos, 25+ triggers, 20+ condições
4. **Reutilização**: Biblioteca com passivas prontas
5. **Customização**: Fácil criar novas passivas ou variantes
6. **Performance**: Sistema eficiente com limites e cooldowns
7. **Debugging**: Contexto completo e logs de ativação

## Limitações e Considerações

- Passivas modificam dano ANTES de aplicar (importante para order of operations)
- Condições são avaliadas com AND lógico (todas devem ser true)
- `always` trigger verifica condições a cada evento (pode ser custoso)
- Limites são por personagem (não globais)
- Cooldowns são em rodadas (não turnos individuais)
- Efeitos de stats são permanentes durante a batalha
- Status effects seguem sistema existente de StatusManager

## Compatibilidade

- ✅ Mantém campo `passive` string para UI
- ✅ `passiveAbility` opcional - personagens antigos funcionam
- ✅ Auto-sync detecta mudanças em passivas
- ✅ Modo memória e banco de dados suportados
- ✅ Backward compatible com código existente

## Documentação

- **SISTEMA_PASSIVAS.md**: Guia completo com todos os tipos, exemplos e referências
- **PASSIVAS_QUICK_START.md**: Guia rápido de 5 minutos para começar
- **passive-library.ts**: 35+ passivas prontas com comentários
- **PassiveTypes.ts**: Tipos completos com TSDoc

## Próximas Expansões Possíveis

- [ ] Passivas de equipamentos/itens temporários
- [ ] Passivas condicionais por fase (boss)
- [ ] Passivas com stacking (acumula por ativação)
- [ ] Passivas de sinergia (ativa com aliados específicos)
- [ ] Passivas de combo (sequência de ações)
- [ ] Visual feedback de passivas no Discord
- [ ] Logs de ativação mais detalhados
- [ ] Analytics de passivas mais usadas

## Testing

Todos os personagens têm passivas funcionais que podem ser testadas via:
- `/batalha-pve` - PvE simples
- `/battle` - Batalhas customizadas
- Qualquer modo de combate existente

**Status**: Sistema completo e funcional em produção ✅
