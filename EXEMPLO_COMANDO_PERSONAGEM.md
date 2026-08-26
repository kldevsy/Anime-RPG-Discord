# 📋 Comando /personagem - Nova Visualização

## Antes vs Depois

### ❌ ANTES (Passiva Simples)

```
🎴 Personagem: Sasuke Uchiha
─────────────────────────────
📺 Anime: Naruto
⭐ Raridade: EPIC
🗡️ Função: DPS
❤️ HP Base: 1050
⚔️ Ataque Base: 220
🛡️ Defesa Base: 112
⚡ Velocidade: 122
🔮 Passiva: Sharingan
```

### ✅ DEPOIS (Passiva Detalhada)

```
🎴 Personagem: Sasuke Uchiha
─────────────────────────────
📺 Anime: Naruto
⭐ Raridade: EPIC
🗡️ Função: DPS
❤️ HP Base: 1050
⚔️ Ataque Base: 220
🛡️ Defesa Base: 112
⚡ Velocidade: 122

🔮 Passiva
──────────
Sharingan
Aumenta chance de crítico em 15% e dano crítico em 30%

🎯 Trigger: Início da Batalha
💫 Efeitos: +15% Chance Crítico, +30% Dano Crítico
```

---

## Exemplos de Diferentes Passivas

### 1. Passiva Simples (Goku - Battle Instinct)

```
🔮 Passiva
──────────
Instinto de Batalha
Ao sobreviver a um crítico, ganha 40% de ataque por 2 turnos

🎯 Trigger: Ao Receber Crítico
💫 Efeitos: Aplica attack_up
⏱️ Limites: 1x por rodada
```

### 2. Passiva Condicional (Naruto - Determination)

```
🔮 Passiva
──────────
Determinação
Quando HP está abaixo de 50%, ganha 25% de ataque

🎯 Trigger: Sempre Ativo
💫 Efeitos: +25% Ataque
✅ Condições: HP < 50%
```

### 3. Passiva de Cura (Sakura - Chakra Control)

```
🔮 Passiva
──────────
Controle de Chakra
Cura o aliado com menor HP em 150 no início de cada rodada

🎯 Trigger: Início de Rodada
💫 Efeitos: Cura 150 HP
```

### 4. Passiva Defensiva (Luffy - Resilience)

```
🔮 Passiva
──────────
Resiliência
Reduz o primeiro dano recebido na batalha em 50%

🎯 Trigger: Ao Receber Dano
💫 Efeitos: 50% Redução de Dano
⏱️ Limites: 1x por batalha
```

### 5. Passiva com Chance (Ichigo - Spiritual Pressure)

```
🔮 Passiva
──────────
Pressão Espiritual
30% de chance de causar 20% de dano adicional

🎯 Trigger: Ao Acertar
💫 Efeitos: +20% Dano
```

### 6. Passiva Complexa (Zoro - Three Sword Style)

```
🔮 Passiva
──────────
Santoryu (Três Espadas)
Ataques básicos têm 25% de chance de aplicar sangramento por 3 turnos

🎯 Trigger: Ao Atacar (Básico)
💫 Efeitos: Aplica bleed
```

### 7. Passiva de Velocidade (Tanjiro - Water Breathing)

```
🔮 Passiva
──────────
Respiração da Água
Reduz dano recebido em 15% e aumenta velocidade em 10

🎯 Trigger: Início da Batalha
💫 Efeitos: +10 Velocidade, +15% Defesa
```

### 8. Passiva de Energia (Yuji - Superhuman Strength)

```
🔮 Passiva
──────────
Força Sobre-humana
Ao dar crítico, ganha 10 de carga de ultimate

🎯 Trigger: Ao Dar Crítico
💫 Efeitos: +10 Carga Ultimate
```

---

## 🎯 Informações Exibidas

### Sempre Mostrado
- ✅ **Nome da Passiva**
- ✅ **Descrição**
- ✅ **Trigger** (quando ativa)
- ✅ **Efeitos** (o que faz)

### Mostrado se Existir
- 📝 **Condições** (requisitos para ativar)
- ⏱️ **Limites** (máx ativações, cooldown)

---

## 🎨 Formatação de Triggers

| Trigger Code | Exibido Como |
|--------------|--------------|
| `on_battle_start` | Início da Batalha |
| `on_round_start` | Início de Rodada |
| `on_turn_start` | Início do Turno |
| `on_hit` | Ao Acertar |
| `on_critical_hit` | Ao Dar Crítico |
| `on_damaged` | Ao Receber Dano |
| `on_kill` | Ao Derrotar Inimigo |
| `on_basic_attack` | Ao Atacar (Básico) |
| `always` | Sempre Ativo |

---

## 💫 Formatação de Efeitos

| Effect Type | Exibido Como |
|-------------|--------------|
| `increase_attack` | +X% Ataque |
| `increase_defense` | +X% Defesa |
| `increase_speed` | +X Velocidade |
| `increase_crit_chance` | +X% Chance Crítico |
| `increase_crit_damage` | +X% Dano Crítico |
| `bonus_damage_percent` | +X% Dano |
| `lifesteal` | X% Lifesteal |
| `heal_percent` | Cura X% HP |
| `damage_reduction` | X% Redução de Dano |
| `shield` | Escudo de X HP |
| `reflect_damage` | Reflete X% do Dano |
| `counter_attack` | Contra-ataque X% |
| `gain_ultimate_charge` | +X Carga Ultimate |
| `apply_status` | Aplica [status] |
| `cleanse_debuff` | Remove X Debuff(s) |

---

## ✅ Formatação de Condições

| Condition Type | Exibido Como |
|----------------|--------------|
| `hp_below_percent` | HP < X% |
| `hp_above_percent` | HP > X% |
| `target_hp_below_percent` | Alvo HP < X% |
| `is_critical` | Crítico |
| `is_last_standing` | Último Vivo |
| `round_above` | Após Rodada X |

---

## ⏱️ Formatação de Limites

| Limite | Exibido Como |
|--------|--------------|
| `maxActivationsPerBattle: 3` | 3x por batalha |
| `maxActivationsPerRound: 1` | 1x por rodada |
| `cooldownRounds: 2` | 2 rodadas de cooldown |

---

## 🎮 Como Testar

```bash
# No Discord
/personagem nome:Sasuke Uchiha
/personagem nome:Goku
/personagem nome:Naruto Uzumaki
/personagem nome:Zoro
```

Você verá todas as informações detalhadas da passiva de cada personagem!

---

## 📊 Vantagens da Nova Visualização

### ✨ Para Jogadores
- 🎯 **Clareza**: Entende exatamente o que a passiva faz
- 📈 **Estratégia**: Sabe quando e como a passiva ativa
- 🔢 **Valores**: Vê números exatos de bônus
- ⚖️ **Balanceamento**: Compreende limites e cooldowns
- 🎮 **Imersão**: Informação rica e detalhada

### 🔧 Para Desenvolvedores
- ✅ **Automático**: Não precisa atualizar manualmente
- 🔄 **Sincronizado**: Sempre reflete o código real
- 📝 **Consistente**: Mesmo formato para todas passivas
- 🐛 **Debug**: Fácil ver se passiva está configurada
- 📚 **Documentação**: Serve como referência in-game

---

## 🚀 Build e Deploy

```bash
# Build
pnpm --filter @workspace/api-server run build

# Ou via auto-sync
# Salve o arquivo e aguarde ~5s
```

---

## 💡 Dica

Se a descrição da passiva ficar muito grande (>1024 caracteres), o Discord trunca automaticamente. Os primeiros 1024 caracteres sempre incluem as informações mais importantes (nome, descrição, trigger, efeitos).

---

**Agora os jogadores podem ver EXATAMENTE o que cada passiva faz!** 🎉
