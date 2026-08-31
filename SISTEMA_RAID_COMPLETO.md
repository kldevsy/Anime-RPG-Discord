# 🏰 SISTEMA DE RAID - DESIGN COMPLETO

## 🎯 VISÃO GERAL:

Sistema cooperativo multiplayer onde até 4 jogadores se unem para enfrentar desafios épicos, bosses poderosos e ganhar recompensas premium.

---

## 📊 ESTRUTURA DO SISTEMA:

### **1. SALAS DE RAID**
- **Capacidade:** 1-4 jogadores
- **Criador:** Líder da sala (controla start)
- **Entrada:** Código único ou convite
- **Expiração:** 15 minutos de inatividade

### **2. COMPOSIÇÃO DE TIME**
- **Máximo:** 4 personagens na raid
- **Cada jogador:** Contribui 1+ personagens
- **Auto-fill:** Se < 4 jogadores, podem adicionar mais personagens
- **Exemplo:**
  ```
  2 jogadores = cada um pode adicionar 2 personagens
  3 jogadores = um adiciona 2, outros 1
  4 jogadores = 1 personagem cada
  ```

### **3. DIFICULDADES**
| Dificuldade | Multiplicador | Drops | Gemas | XP Maestria |
|-------------|---------------|-------|-------|-------------|
| 🟢 Normal | 1.0x | Padrão | 100-200 | 100-200 |
| 🟡 Difícil | 1.5x | +50% | 200-400 | 300-500 |
| 🔴 Pesadelo | 2.5x | +150% | 500-1000 | 800-1500 |

---

## 🗺️ MAPAS DE RAID:

### **RAID 1: TORRE DO ESQUECIMENTO** 🗼
**Tema:** Torre misteriosa com 5 andares
**Boss Final:** Guardião Eterno
**Dificuldade Base:** Normal
**Inimigos:** 3 waves + 1 boss
**Drops Especiais:** 
- Espada do Guardião [Legendary]
- Armadura Etérea [Epic]
- Loot Box Mítica (5% chance)

**Layout:**
```
Andar 1: 3 inimigos comuns (DPS)
Andar 2: 2 inimigos elite (Tank + Healer)
Andar 3: 4 inimigos comuns (Mix)
Andar 4: 1 mini-boss (Alta DEF)
Andar 5: GUARDIÃO ETERNO (Boss)
```

**Boss - Guardião Eterno:**
- HP: 8000
- ATK: 280
- DEF: 200
- SPD: 140
- Passiva: A cada 25% HP perdido, invoca 2 adds
- Ultimate: "Julgamento Final" - 4.0x AoE + Stun 2 turnos

---

### **RAID 2: CAVERNA DO CAOS** 🌋
**Tema:** Caverna de lava com monstros demoníacos
**Boss Final:** Senhor do Caos
**Dificuldade Base:** Difícil
**Inimigos:** 4 waves + 1 boss
**Drops Especiais:**
- Colar do Caos [Mythic]
- Botas Flamejantes [Legendary]
- 2x Loot Box Épica (garantido)

**Layout:**
```
Caverna 1: 4 inimigos (Fire themed)
Caverna 2: 3 inimigos elite (High ATK)
Caverna 3: 2 mini-bosses (Twin Demons)
Caverna 4: 5 inimigos + burn passivo (ambiente)
Caverna 5: SENHOR DO CAOS (Boss)
```

**Boss - Senhor do Caos:**
- HP: 12000
- ATK: 320
- DEF: 180
- SPD: 150
- Passiva: Aplica Burn em TODOS no início de cada turno (60 dano)
- Fase 2 (<50% HP): +50% ATK, +30 SPD
- Ultimate: "Explosão Caótica" - 5.0x AoE + Burn 4 turnos

---

### **RAID 3: SANTUÁRIO CELESTIAL** ☁️
**Tema:** Templo flutuante com anjos corrompidos
**Boss Final:** Arcanjo Caído
**Dificuldade Base:** Pesadelo
**Inimigos:** 5 waves + 1 boss
**Drops Especiais:**
- Asa Celestial [Mythic]
- Halo Corrompido [Legendary]
- 3x Loot Box Lendária (garantido)
- 1x Loot Box Mítica (25% chance)

**Layout:**
```
Salão 1: 3 anjos menores (Healer focus)
Salão 2: 4 paladinos (Tank + Control)
Salão 3: 2 arcanjos (Elite DPS)
Salão 4: Boss Intermediário (Serafim)
Salão 5: 6 guardians + Adds
Salão 6: ARCANJO CAÍDO (Boss Final)
```

**Boss - Arcanjo Caído:**
- HP: 18000
- ATK: 380
- DEF: 220
- SPD: 170
- Passiva: A cada 2 turnos, cura 500 HP e aplica Shield (300)
- Fase 2 (<60% HP): Invoca 2 Serafins de add
- Fase 3 (<30% HP): Enrage - +100% ATK, +50 SPD
- Ultimate: "Juízo Divino" - 6.0x single target + execução se < 20% HP

---

## 🎮 HUB DA RAID (Interface):

### **TELA 1: CRIAR/ENTRAR RAID**
```
╔════════════════════════════════╗
║    🏰 SISTEMA DE RAIDS 🏰     ║
╠════════════════════════════════╣
║                                ║
║  [🆕 Criar Nova Raid]         ║
║                                ║
║  [🔍 Entrar com Código]       ║
║                                ║
║  [📋 Minhas Raids Ativas]     ║
║                                ║
║  [🏆 Ranking de Raids]        ║
║                                ║
╚════════════════════════════════╝
```

### **TELA 2: CONFIGURAR RAID (Líder)**
```
╔════════════════════════════════╗
║     ⚙️ CONFIGURAR RAID ⚙️      ║
╠════════════════════════════════╣
║                                ║
║  Mapa: [Select Menu ▼]        ║
║  • Torre do Esquecimento       ║
║  • Caverna do Caos             ║
║  • Santuário Celestial         ║
║                                ║
║  Dificuldade: [Select Menu ▼] ║
║  • 🟢 Normal                   ║
║  • 🟡 Difícil                  ║
║  • 🔴 Pesadelo                 ║
║                                ║
║  Código: RAID-A7F9             ║
║                                ║
║  [✅ Confirmar]  [❌ Cancelar] ║
║                                ║
╚════════════════════════════════╝
```

### **TELA 3: SALA DE ESPERA**
```
╔════════════════════════════════╗
║     👥 SALA DE RAID 👥         ║
╠════════════════════════════════╣
║  Mapa: Torre do Esquecimento   ║
║  Dificuldade: 🟢 Normal        ║
║  Código: RAID-A7F9             ║
║                                ║
║  Jogadores: 2/4                ║
║  ┌──────────────────────────┐  ║
║  │ 👑 Player1 [Líder]       │  ║
║  │    • Naruto              │  ║
║  │    • Sasuke              │  ║
║  │                          │  ║
║  │ 🎮 Player2               │  ║
║  │    • Goku                │  ║
║  │    • Luffy               │  ║
║  │                          │  ║
║  │ ⏳ Aguardando...         │  ║
║  │                          │  ║
║  │ ⏳ Aguardando...         │  ║
║  └──────────────────────────┘  ║
║                                ║
║  [➕ Adicionar Personagem]     ║
║  [🚀 Iniciar Raid] (Líder)    ║
║  [🚪 Sair]                     ║
║                                ║
╚════════════════════════════════╝
```

### **TELA 4: SELECIONAR PERSONAGENS**
```
╔════════════════════════════════╗
║  📋 SEUS PERSONAGENS 📋        ║
╠════════════════════════════════╣
║                                ║
║  Selecione até 2 personagens:  ║
║  (Slots disponíveis: 2)        ║
║                                ║
║  [Select Menu: Personagem 1 ▼] ║
║  • Naruto Uzumaki Nv.50        ║
║  • Sasuke Uchiha Nv.45         ║
║  • Sakura Haruno Nv.40         ║
║  • ...                         ║
║                                ║
║  [Select Menu: Personagem 2 ▼] ║
║  • Sasuke Uchiha Nv.45         ║
║  • Kakashi Hatake Nv.42        ║
║  • ...                         ║
║                                ║
║  [✅ Confirmar]  [❌ Cancelar] ║
║                                ║
╚════════════════════════════════╝
```

---

## 💎 SISTEMA DE RECOMPENSAS:

### **DROPS BASE POR DIFICULDADE:**

#### 🟢 **NORMAL:**
- **Gold:** 1000-2000
- **Gemas:** 100-200
- **XP Maestria:** 100-200
- **Tickets:** 10-20
- **Equipamentos:** Common (60%), Uncommon (30%), Rare (10%)
- **Loot Box:** Basic (40% chance)
- **Drop Especial:** 5% chance

#### 🟡 **DIFÍCIL:**
- **Gold:** 2500-4000
- **Gemas:** 200-400
- **XP Maestria:** 300-500
- **Tickets:** 25-40
- **Equipamentos:** Uncommon (40%), Rare (35%), Epic (20%), Legendary (5%)
- **Loot Box:** Advanced (60% chance), Epic (20% chance)
- **Drop Especial:** 15% chance

#### 🔴 **PESADELO:**
- **Gold:** 5000-8000
- **Gemas:** 500-1000
- **XP Maestria:** 800-1500
- **Tickets:** 50-80
- **Equipamentos:** Rare (30%), Epic (35%), Legendary (25%), Mythic (10%)
- **Loot Box:** Epic (50% chance), Legendary (30% chance), Mythic (10% chance)
- **Drop Especial:** 35% chance

### **DROPS ESPECIAIS POR RAID:**

**Torre do Esquecimento:**
- Espada do Guardião [Legendary] - 8% drop
- Armadura Etérea [Epic] - 15% drop
- Amuleto da Torre [Rare] - 25% drop

**Caverna do Caos:**
- Colar do Caos [Mythic] - 5% drop
- Botas Flamejantes [Legendary] - 12% drop
- Escudo Ígneo [Epic] - 20% drop

**Santuário Celestial:**
- Asa Celestial [Mythic] - 8% drop
- Halo Corrompido [Legendary] - 15% drop
- Anel Angelical [Epic] - 25% drop

### **BÔNUS DE GRUPO:**
```
2 jogadores: +10% drops
3 jogadores: +25% drops
4 jogadores: +50% drops
```

### **BÔNUS DE PRIMEIRA VEZ:**
```
Primeira clear: 2x recompensas
Primeira clear Difícil: 3x recompensas
Primeira clear Pesadelo: 5x recompensas
```

---

## 🎲 MECÂNICAS DE BATALHA:

### **ADAPTAÇÕES DO MOTOR DE ARENA:**
- ✅ Mesmo sistema de turnos
- ✅ Ultimates e passivas funcionam igual
- ✅ Equipamentos aplicados
- ✅ Maestria considerada

### **NOVIDADES:**
- 🆕 **Adds dinâmicos:** Boss invoca inimigos
- 🆕 **Fases de Boss:** Stats mudam em % HP
- 🆕 **Efeitos de ambiente:** Burn, Poison, etc passivos
- 🆕 **Checkpoints:** Salva progresso entre waves
- 🆕 **Revive system:** Gaste gemas para reviver time

### **SISTEMA DE WAVES:**
```
Wave 1 → Wave 2 → Wave 3 → Boss
  ↓        ↓        ↓        ↓
Clear   Clear   Clear   Clear
  ↓        ↓        ↓        ↓
+Heal   +Heal   +Heal   LOOT!
(20%)   (30%)   (40%)
```

### **REVIVE:**
- **Custo:** 50 gemas por tentativa
- **Efeito:** Revive TODOS com 50% HP
- **Limite:** 2 revives por raid
- **Vote:** Maioria decide (2/3 votos)

---

## 📊 SCHEMA DO BANCO:

### **TABELAS:**

```typescript
// 1. raid_instances - Instâncias de raid ativas
{
  id: UUID
  leaderId: string (user_id)
  raidMapId: string
  difficulty: enum [normal, hard, nightmare]
  roomCode: string (RAID-XXXX)
  status: enum [waiting, in_progress, completed, failed]
  maxPlayers: int (4)
  currentWave: int
  createdAt: timestamp
  expiresAt: timestamp
  completedAt: timestamp?
}

// 2. raid_participants - Jogadores na raid
{
  id: UUID
  raidInstanceId: UUID
  userId: string
  joinedAt: timestamp
  isReady: boolean
  contribution: int (personagens adicionados)
}

// 3. raid_team_members - Personagens na raid
{
  id: UUID
  raidInstanceId: UUID
  participantId: UUID
  ownedCharacterId: string
  position: int (1-4)
  isAlive: boolean
  currentHp: int
}

// 4. raid_maps - Catálogo de raids
{
  id: string
  name: string
  description: string
  theme: string
  minLevel: int
  recommendedPower: int
  waves: jsonb (array de waves)
  bossData: jsonb
  baseRewards: jsonb
  specialDrops: jsonb
}

// 5. raid_completions - Histórico de clears
{
  id: UUID
  raidInstanceId: UUID
  raidMapId: string
  difficulty: enum
  participants: jsonb (user IDs)
  clearTime: int (segundos)
  totalDamage: int
  deathCount: int
  isFirstClear: boolean (por usuário)
  rewards: jsonb
  completedAt: timestamp
}

// 6. raid_leaderboard - Ranking
{
  id: UUID
  raidMapId: string
  difficulty: enum
  userId: string
  bestTime: int
  totalClears: int
  fastestClearRewards: jsonb
  updatedAt: timestamp
}
```

---

## 🎯 COMANDOS DISCORD:

```
/raid criar
├─ Abre menu de configuração
├─ Seleciona mapa (select menu)
├─ Seleciona dificuldade (select menu)
└─ Gera código e cria sala

/raid entrar codigo:RAID-XXXX
├─ Entra na sala
└─ Abre menu de seleção de personagens

/raid status
├─ Mostra raids ativas
├─ Progresso atual
└─ Código da sala

/raid sair
├─ Sai da raid atual
└─ (Líder cancela raid)

/raid ranking
├─ Select menu de mapa
├─ Select menu de dificuldade
└─ Mostra top 10

/raid info mapa:[nome]
├─ Informações do mapa
├─ Recompensas
├─ Boss info
└─ Dificuldades
```

---

## 🔄 FLUXO COMPLETO:

```
1. Líder: /raid criar
   ↓
2. Configura: Mapa + Dificuldade
   ↓
3. Recebe: Código RAID-XXXX
   ↓
4. Compartilha código
   ↓
5. Outros: /raid entrar codigo:RAID-XXXX
   ↓
6. Todos: Selecionam personagens
   ↓
7. Líder: Clica [🚀 Iniciar Raid]
   ↓
8. Batalha: Wave 1 → 2 → 3 → Boss
   ↓
9. Vitória: Distribui recompensas
   ↓
10. Embed final: Mostra drops de TODOS
```

---

## 🎨 EMBEDS:

### **1. EMBED: LISTA DE RAIDS**
```
🏰 RAIDS DISPONÍVEIS 🏰

🗼 Torre do Esquecimento
├─ Nível: 30+
├─ Dificuldades: 🟢🟡🔴
└─ Tempo médio: 15-20min

🌋 Caverna do Caos
├─ Nível: 40+
├─ Dificuldades: 🟡🔴
└─ Tempo médio: 20-25min

☁️ Santuário Celestial
├─ Nível: 50+
├─ Dificuldade: 🔴
└─ Tempo médio: 30-40min

Use /raid criar para começar!
```

### **2. EMBED: SALA DE ESPERA**
```
👥 SALA DE RAID 👥

Mapa: 🗼 Torre do Esquecimento
Dificuldade: 🟢 Normal
Código: RAID-A7F9

━━━━━━━━━━━━━━━━━━━━━━
JOGADORES (2/4):

👑 Player1 [Líder]
  • Naruto Uzumaki Nv.50
  • Sasuke Uchiha Nv.45

🎮 Player2
  • Goku Nv.55
  • Luffy Nv.48

⏳ Aguardando mais jogadores...
━━━━━━━━━━━━━━━━━━━━━━

💡 Cada jogador pode adicionar mais
   personagens até completar 4 total!
```

### **3. EMBED: BATALHA EM PROGRESSO**
```
⚔️ RAID EM PROGRESSO ⚔️

🗼 Torre do Esquecimento - 🟢 Normal

━━━━━━━━━━━━━━━━━━━━━━
PROGRESSO:
[▰▰▰▱▱] Wave 3/5

EQUIPE:
❤️ Naruto: 850/920 HP
❤️ Sasuke: 620/880 HP
💀 Goku: MORTO
❤️ Luffy: 1100/1250 HP

INIMIGOS:
👹 Guardião Elite: 450/1200 HP
👹 Soldado x2: 300/500 HP cada

━━━━━━━━━━━━━━━━━━━━━━
Aguardando ações dos jogadores...
```

### **4. EMBED: VITÓRIA**
```
🎉 RAID CONCLUÍDA! 🎉

🗼 Torre do Esquecimento - 🟢 Normal

━━━━━━━━━━━━━━━━━━━━━━
⏱️ Tempo: 18min 34s
💀 Mortes: 2
⚔️ Dano Total: 45,320

━━━━━━━━━━━━━━━━━━━━━━
🎁 RECOMPENSAS:

Player1 (MVP - 45% dano):
💰 1,800 Gold
💎 180 Gemas
✨ 220 XP Maestria
🎟️ 18 Tickets
⚔️ Espada do Guardião [Legendary] 🎊

Player2:
💰 1,200 Gold
💎 120 Gemas
✨ 150 XP Maestria
🎟️ 12 Tickets
📦 Loot Box Básica

━━━━━━━━━━━━━━━━━━━━━━
🏆 PRIMEIRA CLEAR! Bônus 2x aplicado!
```

---

## 📈 BALANCEAMENTO:

### **DIFICULDADE POR NÍVEL:**
```
Torre: Nível 30-40 (3000-5000 power)
Caverna: Nível 40-50 (5000-8000 power)
Santuário: Nível 50+ (8000+ power)
```

### **ESCALAMENTO DE BOSS:**
```
Normal: Stats base
Difícil: +50% HP, +30% ATK/DEF
Pesadelo: +150% HP, +80% ATK/DEF, +50 SPD
```

### **TEMPO RECOMENDADO:**
```
Normal: 15-20min
Difícil: 20-30min
Pesadelo: 30-45min
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO:

### **Backend:**
- [ ] Schema do banco (6 tabelas)
- [ ] RaidService completo
- [ ] RaidBattleEngine (adaptar da arena)
- [ ] Sistema de waves
- [ ] Sistema de drops
- [ ] Leaderboard

### **Discord Bot:**
- [ ] Comandos /raid
- [ ] Embeds interativos
- [ ] Botões e select menus
- [ ] Sistema de votação
- [ ] Notificações

### **Data:**
- [ ] 3 mapas de raid (catálogo)
- [ ] Boss data
- [ ] Rewards tables
- [ ] Special drops

### **Testes:**
- [ ] Solo (1 player, 4 personagens)
- [ ] Duo (2 players, 2 cada)
- [ ] Full party (4 players)
- [ ] Boss mechanics
- [ ] Drops distribution

---

## 🚀 PRÓXIMOS PASSOS:

1. **Criar schema do banco**
2. **Criar RaidService**
3. **Criar catálogo de raids**
4. **Adaptar BattleEngine**
5. **Criar comandos Discord**
6. **Criar embeds interativos**
7. **Sistema de recompensas**
8. **Testar e balancear**

---

**SISTEMA COMPLETO E PROFISSIONAL! 🏰⚔️🎁**
