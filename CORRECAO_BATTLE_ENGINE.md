# 🔧 Correção: BattleEngine API

## ❌ Problema:
```
TypeError: this.playerTeam is not iterable
```

## 🔍 Causa:
O `BattleEngine` tem uma API diferente do que eu estava usando:

### API Real do BattleEngine:
```typescript
constructor(playerTeam: Combatant[], enemyTeam: Combatant[])

// Snapshot retorna:
interface BattleSnapshot {
  phase: BattlePhase;
  round: number;
  playerTeam: Combatant[];  // NÃO é "allies"
  enemyTeam: Combatant[];   // NÃO é "enemies"
  actions: BattleAction[];
}
```

### O que eu estava fazendo (ERRADO):
```typescript
// ❌ Criando com objeto
const engine = new BattleEngine({
  allies: playerTeam,
  enemies: enemies,
  maxRounds: 30,
});

// ❌ Acessando propriedades erradas
result.allies  // Não existe!
result.enemies // Não existe!
result.victor  // Não existe!
result.maxRounds // Não existe!
```

## ✅ Solução:

### 1. Correção na criação do BattleEngine:
```typescript
// AdaptivePvpService.ts
// ANTES:
const engine = new BattleEngine({
  allies: playerTeam,
  enemies: enemies,
  maxRounds: 30,
});

// DEPOIS:
const engine = new BattleEngine(playerTeam, enemies);
```

### 2. Correção na execução:
```typescript
// ANTES:
const result = await engine.run();

// DEPOIS:
const result = onSnapshot 
  ? await engine.runAnimated(onSnapshot, 30, ultimateDecisionProvider)
  : engine.run(30);
```

### 3. Correção no resultado:
```typescript
// ANTES:
const victory = result.victor === "ally";

// DEPOIS:
const victory = result.phase === "PLAYER_VICTORY";
```

### 4. Correção nos embeds (playerTeam/enemyTeam):
```typescript
// ANTES:
result.allies.filter(a => a.alive)
result.enemies.filter(e => e.alive)
result.maxRounds
snapshot.allies
snapshot.enemies
snapshot.log

// DEPOIS:
result.playerTeam.filter(a => a.alive)
result.enemyTeam.filter(e => e.alive)
30 // Fixo, não vem no snapshot
snapshot.playerTeam
snapshot.enemyTeam
snapshot.actions // NÃO é "log"
```

### 5. Correção no handler (referência antes de definir):
```typescript
// ANTES:
const battleResult = await runAdaptivePvpBattle(
  discordId,
  difficulty,
  async (snapshot) => {
    // ❌ battleResult ainda não existe aqui!
    const progressEmbed = createAdaptivePvpProgressEmbed(
      username,
      battleResult?.enemyTeamName ?? "Equipe Inimiga",
      // ...
    );
  }
);

// DEPOIS:
let enemyTeamName = "Equipe Inimiga"; // Define antes
const battleResult = await runAdaptivePvpBattle(
  discordId,
  difficulty,
  async (snapshot) => {
    // ✅ Usa variável externa
    const progressEmbed = createAdaptivePvpProgressEmbed(
      username,
      enemyTeamName,
      // ...
    );
  }
);
// Atualiza após obter resultado
enemyTeamName = battleResult.enemyTeamName;
```

## 📋 Fases de Batalha (BattlePhase):

```typescript
type BattlePhase = 
  | "WAITING"
  | "PLAYER_VICTORY"
  | "ENEMY_VICTORY"
  | "DRAW";
```

## 📊 Estrutura Correta do BattleSnapshot:

```typescript
{
  phase: "PLAYER_VICTORY" | "ENEMY_VICTORY" | "DRAW" | "WAITING",
  round: number,
  turn: number,
  initiative: string[],
  playerTeam: Combatant[],  // Seu time
  enemyTeam: Combatant[],   // Time inimigo
  actions: BattleAction[]   // Log de ações
}
```

## 📁 Arquivos Corrigidos:

1. ✅ `AdaptivePvpService.ts`
   - Constructor do BattleEngine
   - Execução com maxRounds
   - Verificação de vitória com phase

2. ✅ `embeds.ts`
   - `createAdaptivePvpVictoryEmbed()` - allies → playerTeam, enemies → enemyTeam
   - `createAdaptivePvpDefeatEmbed()` - allies → playerTeam, enemies → enemyTeam
   - `createAdaptivePvpProgressEmbed()` - allies → playerTeam, enemies → enemyTeam
   - Remover maxRounds (usar fixo 30)

3. ✅ `handlers.ts`
   - Variável enemyTeamName externa ao callback
   - Verificação com phase ao invés de victor
   - Log corrigido (actions ao invés de log)

## 🧪 Para Testar:

```bash
cd c:\Users\walyc\Anime-RPG-Discord
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run bot
```

No Discord:
```
/arena
/arena dificuldade:Difícil
/arena dificuldade:Pesadelo velocidade:Rápido
```

## ✅ Status: CORRIGIDO!

Agora a arena deve funcionar corretamente com a API real do BattleEngine.
