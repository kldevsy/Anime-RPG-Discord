# ⚔️ Sistema de Arena PvP Adaptativa

## 🎮 Visão Geral

Foi implementado um sistema completo de batalha PvP adaptativa onde você enfrenta times aleatórios de personagens do próprio catálogo do bot. O sistema **escala automaticamente** com seu progresso, tornando as batalhas progressivamente mais desafiadoras!

## ✨ Features Implementadas

### 🎯 **Sistema de Adaptação Inteligente**

O sistema analisa SEU time e gera inimigos balanceados baseado em:

1. **Nível Médio do Seu Time**
   - Inimigos têm nível proporcional aos seus personagens
   - Multiplicadores de dificuldade: Easy 0.7x, Normal 1.0x, Hard 1.3x, Nightmare 1.6x

2. **Maestria Média**
   - Inimigos aplicam boost de maestria igual ou superior ao seu
   - Pesadelo: +50% de maestria em relação ao seu time

3. **Power Level**
   - Calcula a força total do seu time (HP×0.4 + ATK×2.5 + DEF×1.5 + SPD×1.2)
   - Recompensas escalam com seu power level

4. **Tamanho do Time**
   - Inimigos têm 3-5 membros baseado no tamanho do seu time
   - Pesadelo: +1 membro extra

### 🎲 **Geração Aleatória de Times Inimigos**

- Seleciona personagens aleatórios do catálogo completo (35 personagens)
- Cada personagem tem variação de ±5% nos stats (uniqueness)
- Nome do time baseado no anime dominante:
  - "Força de Elite Naruto"
  - "Guarda Real Demon Slayer"
  - "Patrulha Jujutsu Kaisen"
  - etc.

### 🎯 **4 Níveis de Dificuldade**

#### 🟢 **Fácil (Easy)**
- Inimigos Lv: 70% do seu
- Maestria: 80% da sua
- Stats: 85% dos seus
- Crítico: 15% base
- **Recompensas:** 100 Gold, 5 Gemas, 50 XP

#### 🟡 **Normal**
- Inimigos Lv: 100% do seu (equilibrado)
- Maestria: 100% da sua
- Stats: 100% dos seus
- Crítico: 15% base
- **Recompensas:** 200 Gold, 10 Gemas, 100 XP

#### 🔴 **Difícil (Hard)**
- Inimigos Lv: 130% do seu
- Maestria: 120% da sua
- Stats: 115% dos seus
- Crítico: 20% (+5%)
- **Recompensas:** 350 Gold, 20 Gemas, 200 XP

#### ⚫ **Pesadelo (Nightmare)**
- Inimigos Lv: 160% do seu
- Maestria: 150% da sua
- Stats: 135% dos seus
- Crítico: 25% (+10%)
- Dano Crítico: 1.8x (+0.3x)
- Time inimigo: +1 membro extra
- **Recompensas:** 600 Gold, 40 Gemas, 400 XP

### 💰 **Sistema de Recompensas**

**Vitória:**
- 100% das recompensas
- Escalamento com power level (1 + powerLevel/10000)
- Quanto mais forte você é, maiores as recompensas

**Derrota:**
- 30% das recompensas (consolação)
- Não perde recursos
- Ainda ganha Gold, Gemas e XP

### 📊 **Interface de Batalha**

#### **Durante a Batalha:**
- Embed de progresso atualizado a cada turno
- **Seu time:** mostra HP + barra de Ultimate Charge
- **Time inimigo:** mostra HP apenas (sem ultimate charge - mistério!)
- Última ação destacada
- Contador de vivos/mortos

#### **Tela de Vitória (Victory Screen):**
```
🏆 VITÓRIA ÉPICA!

Username derrotou Força de Elite Naruto!

🟡 Dificuldade: Normal
⚔️ Rodadas: 12/30
💀 Derrotados: 5/5

🎁 RECOMPENSAS CONQUISTADAS:
💰 200 Gold
💎 10 Gemas
⭐ 100 XP

✅ Sobreviventes (3/5):
🟢 Gojo - 850/900 HP (94%)
🟡 Itachi - 520/950 HP (55%)
🟠 Madara - 180/1150 HP (16%)
```

#### **Tela de Derrota (Defeat Screen):**
```
💀 DERROTA...

Username foi derrotado por Guarda Real Demon Slayer.

🔴 Dificuldade: Difícil
⚔️ Rodadas sobrevividas: 18/30
⚰️ Inimigos eliminados: 2/5

❗ Não desista! Treine e tente novamente.

💰 Recompensas de Consolação:
💰 105 Gold (30% do normal)
💎 6 Gemas (30% do normal)
⭐ 60 XP (30% do normal)

👹 Inimigos Sobreviventes (3/5):
⚔️ Kokushibo - 78% HP restante
⚔️ Akaza - 92% HP restante
⚔️ Nezuko - 45% HP restante

📚 Sugestão:
💡 Dica: Aprimore seus personagens e considere mudar a formação do time.
```

## 🎮 Como Usar

### Comando:
```
/arena
```

### Opções:

1. **dificuldade** (opcional, padrão: normal)
   - 🟢 Fácil - Treino básico
   - 🟡 Normal - Desafio equilibrado
   - 🔴 Difícil - Para veteranos
   - ⚫ Pesadelo - Apenas os melhores

2. **velocidade** (opcional, padrão: medium)
   - Lento - 2.5s por turno
   - Médio - 1.5s por turno
   - Rápido - 0.8s por turno

### Exemplos:
```bash
# Batalha normal
/arena

# Batalha difícil rápida
/arena dificuldade:Difícil velocidade:Rápido

# Treino fácil
/arena dificuldade:Fácil

# Desafio extremo
/arena dificuldade:Pesadelo velocidade:Lento
```

## 🔧 Arquivos Criados/Modificados

### **Novos Arquivos:**

1. **`artifacts/api-server/src/services/AdaptivePvpService.ts`**
   - Serviço completo de batalha PvP adaptativa
   - Geração de times inimigos
   - Cálculo de power level
   - Sistema de recompensas
   - Adaptação baseada em progresso

### **Arquivos Modificados:**

2. **`artifacts/api-server/src/bot/commands.ts`**
   - Adicionado comando `/arena` com opções de dificuldade e velocidade

3. **`artifacts/api-server/src/bot/handlers.ts`**
   - Handler completo do `/arena`
   - Integração com AdaptivePvpService
   - Animação de batalha frame-by-frame
   - Embeds de vitória/derrota
   - Adicionado "arena" ao defer early

4. **`artifacts/api-server/src/bot/embeds.ts`**
   - `createAdaptivePvpVictoryEmbed()` - Tela de vitória épica
   - `createAdaptivePvpDefeatEmbed()` - Tela de derrota com dicas
   - `createAdaptivePvpProgressEmbed()` - Progresso da batalha (sem mostrar ult inimiga)

## 📊 Mecânicas de Balanceamento

### **Cálculo de Power Level:**
```typescript
powerLevel = (HP × 0.4 + ATK × 2.5 + DEF × 1.5 + SPD × 1.2) / teamSize
```

### **Escalamento de Recompensas:**
```typescript
finalReward = baseReward × (1 + powerLevel / 10000)
```

### **Variação Individual:**
- Cada inimigo tem variance de 95%-105% dos stats calculados
- Torna cada batalha única mesmo contra o mesmo time

### **Multiplicadores de Dificuldade:**

| Dificuldade | Level | Maestria | Stats | Crit | Crit DMG |
|-------------|-------|----------|-------|------|----------|
| Fácil       | 0.7x  | 0.8x     | 0.85x | 15%  | 1.5x     |
| Normal      | 1.0x  | 1.0x     | 1.0x  | 15%  | 1.5x     |
| Difícil     | 1.3x  | 1.2x     | 1.15x | 20%  | 1.65x    |
| Pesadelo    | 1.6x  | 1.5x     | 1.35x | 25%  | 1.8x     |

## 🎯 Diferenças do PvE Normal

### **Arena Adaptativa:**
- ✅ Times aleatórios a cada batalha
- ✅ Escala com SEU progresso
- ✅ Usa personagens reais do catálogo
- ✅ Passivas e ultimates funcionam 100%
- ✅ Recompensas escalam com power level
- ✅ 4 níveis de dificuldade
- ✅ NÃO mostra barra de ultimate dos inimigos
- ✅ Telas de vitória/derrota dedicadas

### **PvE Normal (Stages):**
- Inimigos fixos por stage
- Progressão linear
- Inimigos genéricos/bosses específicos
- Recompensas fixas por stage

## 🌟 Features Especiais

### **Mistério dos Inimigos:**
- Você NÃO vê a carga de ultimate dos inimigos
- Aumenta tensão e estratégia
- Precisa prever quando vão usar ultimate

### **Passivas e Ultimates Funcionam:**
- Inimigos usam todas as habilidades dos personagens
- Sukuna (Mahoraga) adapta contra você
- Gojo evade seus ataques
- Itachi (Susanoo) pode selar seus personagens
- Sistema completo de skills ativo

### **Sistema de Dicas:**
- Derrota mostra dicas específicas por dificuldade
- Sugere melhorias: maestria, composição, personagens META

## 🚀 Como Testar

### 1. Build o projeto:
```bash
cd c:\Users\walyc\Anime-RPG-Discord
pnpm --filter @workspace/api-server run build
```

### 2. Inicie o bot:
```bash
pnpm --filter @workspace/api-server run bot
```

### 3. No Discord:

**Teste Básico:**
```
/arena
```

**Teste Dificuldade:**
```
/arena dificuldade:Fácil
/arena dificuldade:Normal
/arena dificuldade:Difícil
/arena dificuldade:Pesadelo
```

**Teste Velocidades:**
```
/arena velocidade:Rápido
/arena velocidade:Lento
```

**Teste Combo:**
```
/arena dificuldade:Pesadelo velocidade:Lento
```

## 📈 Progressão Sugerida

1. **Iniciante:** Fácil → acumule recompensas e aprenda mecânicas
2. **Intermediário:** Normal → desafio equilibrado
3. **Avançado:** Difícil → teste seus personagens fortes
4. **Expert:** Pesadelo → apenas para times META maxados

## 💡 Estratégias

### **Para Vencer no Pesadelo:**
- Time full Mítico/Lendário
- Maestria Level 10+ em todos
- Composição balanceada: Tank + DPS + Support
- Personagens META: Sukuna (Mahoraga), Gojo, Nakime, Itachi (Susanoo)

### **Melhores Composições:**
1. **Tank Meta:** Sukuna (Mahoraga) + Escanor + Yuta (Rika) + DPS + Support
2. **Speed Clear:** Gojo + Enel + Pain + Fast DPS + Nakime
3. **Burst Team:** Meliodas (Assault) + Sukuna + Madara + Itachi + Healer

## 🎨 Aspectos Visuais

### **Cores dos Embeds:**
- Progresso: Azul (#3498DB)
- Vitória: Verde (#00FF00)
- Derrota: Vermelho (#FF0000)

### **Emojis de Dificuldade:**
- 🟢 Fácil
- 🟡 Normal
- 🔴 Difícil
- ⚫ Pesadelo

### **Indicadores de HP:**
- 🟢 75%+ HP
- 🟡 40-75% HP
- 🟠 15-40% HP
- 🔴 <15% HP
- 💀 Morto

## 🔮 Próximas Expansões Possíveis

1. **Ranking de Arena**
   - Leaderboard de vitórias consecutivas
   - Recordes de velocidade
   - Maior dificuldade vencida

2. **Seasons de Arena**
   - Recompensas especiais por temporada
   - Meta shifts a cada season

3. **Arena com Apostas**
   - Aposte Gold/Gemas para maiores recompensas
   - High risk, high reward

4. **Boss Rush Mode**
   - Enfrente times só de personagens Míticos
   - Recompensas exponenciais

5. **Team Presets do Bot**
   - Times temáticos: "Akatsuki", "Upper Moons", "Jujutsu Sorcerers"
   - Boss teams específicos

## ✅ Status: PRONTO PARA TESTAR!

Sistema completo de Arena PvP Adaptativa implementado e pronto para uso! 🎮⚔️
