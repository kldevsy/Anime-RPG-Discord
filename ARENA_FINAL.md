# ⚔️ Arena PvP - Sistema Final

## ✅ Implementação Completa

O sistema de Arena PvP agora usa **EXATAMENTE** o mesmo motor e visual do comando `/batalha`.

### 🎮 O que mudou:

1. **Motor de Batalha:** Usa `BattleEngine` diretamente (igual `/batalha`)
2. **Embeds Visuais:** Usa `createBattleProgressEmbed` e `createBattleResultEmbed` (igual `/batalha`)
3. **Animação:** Mesma lógica de delay e atualização frame-by-frame
4. **Consistência:** Experiência idêntica entre PvE e Arena

## 📊 Diferenças entre `/batalha` e `/arena`:

| Feature | /batalha (PvE) | /arena (PvP) |
|---------|---------------|--------------|
| Motor | BattleEngine | BattleEngine ✅ |
| Embeds | createBattleProgressEmbed | createBattleProgressEmbed ✅ |
| Inimigos | Fixos por stage | **Aleatórios do catálogo** 🎲 |
| Escalamento | Progressão linear | **Adaptativo ao seu nível** 📈 |
| Dificuldade | Por stage | **4 níveis selecionáveis** 🎯 |
| Recompensas | Gold + XP | Gold + XP + **Gemas** 💎 |
| Times Inimigos | NPCs genéricos | **Personagens reais do jogo** ⚔️ |

## 🎯 Visual Idêntico

### Durante a Batalha:
```
⚔️ Em Combate • Arena: Guarda Real Naruto
Jogador: username
Rodada: 8 • Ação: 23

💥 Madara Uchiha atacou Nakime causando 245 de dano CRÍTICO!

🧑‍🤝‍🧑 Jogador
Gojo (950/950 HP) [✨ PRONTA!]
Itachi (720/950 HP) [67%]

👹 NPCs
Nakime (445/890 HP)
Madara (1018/1150 HP)
Escanor (1315/1500 HP)

✨ Ultimates e regras de recarga
• Gojo: Unlimited Void (80 energia, +25 por basic)
• Itachi: Amaterasu (85 energia, +30 por basic)

🎲 Iniciativa
Gojo → Madara → Itachi → Nakime → Escanor

📜 Últimas ações
[últimas 5 ações]
```

### Resultado (Vitória):
```
🏆 VITÓRIA NA ARENA! • Arena: Guarda Real Naruto

🟡 Dificuldade: Normal
⚔️ Oponente: Guarda Royal Naruto

Jogador: username
Rodada: 12 • Ação: 67

💥 Gojo usou Unlimited Void! Dano: 180

[Times e status dos personagens]

🎁 Recompensas acumuladas
• Gold: +200
• XP: +100

💎 Recompensas Extras da Arena
• Gemas: +10
🎉 Bônus de vitória aplicado!
```

### Resultado (Derrota):
```
💀 DERROTA NA ARENA • Arena: Esquadrão Demon Slayer

🔴 Dificuldade: Difícil
⚔️ Oponente: Esquadrão Demon Slayer

[Status da batalha]

🎁 Recompensas acumuladas
• Gold: +105
• XP: +60

💎 Recompensas Extras da Arena
• Gemas: +6
💰 Recompensa de consolação (30%)
```

## 🛠️ Correções Aplicadas:

### 1. BattleEngine API:
```typescript
// ✅ CORRETO
const engine = new BattleEngine(playerTeam, enemies);
const result = await engine.runAnimated(onSnapshot, 30, ultimateDecisionProvider);

// ❌ ERRADO (antes)
const engine = new BattleEngine({ allies, enemies, maxRounds: 30 });
```

### 2. Embeds Reutilizados:
```typescript
// ✅ CORRETO - Usa embeds padrão
await interaction.editReply({ 
  embeds: [createBattleProgressEmbed(username, enemyTeamName, snapshot)] 
});

const finalEmbed = createBattleResultEmbed(
  username,
  enemyTeamName,
  battleResult.result,
  { gold: rewards.gold, xp: rewards.xp },
  []
);

// ❌ ERRADO (antes) - Embeds customizados que causavam erros
createAdaptivePvpProgressEmbed(...);
createAdaptivePvpVictoryEmbed(...);
```

### 3. Velocidades Alinhadas:
```typescript
// Mesmas velocidades que /batalha
const speedMap: Record<string, number> = {
  slow: 1400,    // Igual /batalha
  medium: 800,   // Igual /batalha
  fast: 350      // Igual /batalha
};
```

### 4. Naming Pattern:
```typescript
// Nome do time inimigo segue padrão da arena
enemyTeamName = `Arena: ${battleResult.enemyTeamName}`;
// Ex: "Arena: Guarda Real Naruto"
```

## 🎮 Como Usar:

```bash
# Batalha normal (padrão)
/arena

# Escolher dificuldade
/arena dificuldade:Fácil
/arena dificuldade:Normal
/arena dificuldade:Difícil
/arena dificuldade:Pesadelo

# Escolher velocidade
/arena velocidade:Lento
/arena velocidade:Médio
/arena velocidade:Rápido

# Combo
/arena dificuldade:Difícil velocidade:Rápido
```

## 🎯 Características Únicas da Arena:

### 1. **Times Aleatórios:**
- Cada batalha enfrenta personagens diferentes
- Seleção aleatória do catálogo completo (35 personagens)
- Nomes dinâmicos baseados no anime dominante

### 2. **Escalamento Adaptativo:**
```typescript
// Calcula seu poder
playerAvgLevel = 5
playerAvgMastery = 3
playerPowerLevel = 1500

// Ajusta inimigos proporcionalmente
enemyLevel = playerAvgLevel × difficulty_multiplier
enemyMastery = playerAvgMastery × difficulty_multiplier
enemyStats = baseStats × difficulty_multiplier
```

### 3. **Recompensas de Gemas:**
- **Exclusivo da Arena**: Ganha gemas
- Vitória: 100% das recompensas
- Derrota: 30% (consolação)

### 4. **4 Níveis de Desafio:**
- 🟢 Fácil: 70% do seu poder
- 🟡 Normal: 100% do seu poder (equilibrado)
- 🔴 Difícil: 130% do seu poder
- ⚫ Pesadelo: 160% do seu poder + time maior

## 📁 Arquivos Finais:

1. ✅ `AdaptivePvpService.ts` - Motor de geração e escalamento
2. ✅ `handlers.ts` - Handler usando embeds padrão
3. ✅ `embeds.ts` - SEM mudanças (usa funções existentes)

## 🧪 Para Testar:

```bash
cd c:\Users\walyc\Anime-RPG-Discord
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run bot
```

No Discord:
```
/arena
/arena dificuldade:Normal velocidade:Médio
/arena dificuldade:Pesadelo velocidade:Rápido
```

## ✅ Status: PRONTO!

A Arena PvP agora funciona **IDENTICAMENTE** ao `/batalha` em termos de visual e motor, mas com a inovação de times aleatórios adaptativos e recompensas exclusivas de gemas! 🎮⚔️💎
