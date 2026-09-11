# 📚 Sistema de Tutorial Interativo - Documentação Completa

## 🎯 Visão Geral

Sistema completo de tutorial interativo para novos jogadores com **10 steps progressivos**, **recompensas generosas** e **integração automática** com comandos do jogo.

### ✨ Características Principais

- ✅ **10 Steps Progressivos** - Do básico ao avançado
- ✅ **Recompensas Automáticas** - Gold, Gems, Tickets e personagem SSR
- ✅ **Detecção Automática** - Avança automaticamente ao completar objetivos
- ✅ **Sistema de Ajuda** - Guias detalhados de todos os sistemas
- ✅ **Progresso Rastreável** - Barra visual e histórico completo
- ✅ **Opcional** - Pode pular ou retomar a qualquer momento

---

## 📋 Os 10 Steps do Tutorial

### 🎮 **Básico**

#### **Step 1: Bem-vindo ao Anime RPG!**
- **Objetivo:** Complete seu registro e ganhe sua primeira recompensa!
- **Como Completar:** Clique no botão "Começar Tutorial!" após usar `/tutorial iniciar`
- **Recompensas:** 💰 1,000 Gold
- **Categoria:** Básico

#### **Step 2: Sua Primeira Invocação**
- **Objetivo:** Invoque pelo menos 1 personagem usando `/invocar`
- **Como Completar:** Use o comando `/invocar` e faça sua primeira gacha
- **Recompensas:** 🎟️ 3 Tickets
- **Categoria:** Básico
- **🤖 Auto-detect:** Sim (ao invocar qualquer personagem)

#### **Step 3: Monte Sua Equipe**
- **Objetivo:** Monte sua primeira equipe com `/equipe definir`
- **Como Completar:** Use `/equipe adicionar` ou `/equipe ordenar` para montar time
- **Recompensas:** 💰 1,500 Gold
- **Categoria:** Básico
- **🤖 Auto-detect:** Sim (ao adicionar personagem na equipe)

### ⚔️ **Batalha**

#### **Step 4: Primeira Batalha PvE**
- **Objetivo:** Complete sua primeira batalha PvE com `/batalha`
- **Como Completar:** Use `/batalha` e vença uma batalha
- **Recompensas:** 💰 2,000 Gold + 💎 10 Gems
- **Categoria:** Batalha
- **🤖 Auto-detect:** Sim (ao vencer primeira batalha)

#### **Step 5: Equipamentos e Poder**
- **Objetivo:** Equipe um item em um personagem com `/equipamento equipar`
- **Como Completar:** Use `/equipamento equipar` e escolha personagem + equipamento
- **Recompensas:** 💎 25 Gems
- **Categoria:** Batalha
- **🤖 Auto-detect:** Sim (ao equipar qualquer item)

#### **Step 6: Arena PvP**
- **Objetivo:** Participe de uma batalha na Arena com `/arena`
- **Como Completar:** Use `/arena` e complete uma batalha PvP
- **Recompensas:** 💰 2,500 Gold + 💎 15 Gems
- **Categoria:** Batalha
- **🤖 Auto-detect:** Sim (ao vencer batalha na arena)

### 🏰 **Avançado**

#### **Step 7: Raids Cooperativas**
- **Objetivo:** Crie ou participe de uma raid com `/raid criar` ou `/raid participar`
- **Como Completar:** Use `/raid criar` para criar raid ou `/raid participar` para entrar
- **Recompensas:** 💰 3,000 Gold + 💎 20 Gems
- **Categoria:** Avançado
- **🤖 Auto-detect:** Manual (use o comando)

### 🎨 **Personalização**

#### **Step 8: Personalize seu Perfil**
- **Objetivo:** Customize algo no seu perfil: `/perfil bio`, `/perfil cor`, `/perfil banner` ou `/perfil showcase`
- **Como Completar:** Use qualquer subcomando de `/perfil` para personalizar
- **Recompensas:** 💰 2,000 Gold + 💎 30 Gems
- **Categoria:** Personalização
- **🤖 Auto-detect:** Sim (ao customizar qualquer parte do perfil)

### 🔥 **Desafio Final**

#### **Step 9: Boss Rush Challenge**
- **Objetivo:** Tente o Boss Rush com `/bossrush iniciar` (não precisa vencer todos)
- **Como Completar:** Use `/bossrush iniciar` e enfrente os bosses
- **Recompensas:** 💰 5,000 Gold + 💎 50 Gems
- **Categoria:** Avançado
- **🤖 Auto-detect:** Manual (use o comando)

### 🎉 **Conclusão**

#### **Step 10: Tutorial Completo!**
- **Objetivo:** Reivindique sua recompensa final épica!
- **Como Completar:** Automático após completar step 9
- **Recompensas:** 
  - 💰 10,000 Gold
  - 💎 100 Gems
  - 🎟️ 5 Tickets
  - ✨ **1 Personagem SSR Garantido** (aleatório do catálogo completo)
- **Categoria:** Final

---

## 🎁 Recompensas Totais

### Por Completar Todo o Tutorial:

| Recurso | Total |
|---------|-------|
| 💰 Gold | **29,000** |
| 💎 Gems | **260** |
| 🎟️ Tickets | **8** |
| ✨ Personagem SSR | **1 Garantido** |

**Valor total:** Suficiente para fazer ~40 invocações ou comprar várias loot boxes!

---

## 🎮 Comandos do Tutorial

### `/tutorial iniciar`
Inicia o tutorial do zero. Mostra o Step 1 com botão interativo.

**Quando usar:**
- Primeira vez jogando
- Quer recomeçar o tutorial

**Exemplo:**
```
/tutorial iniciar
```

### `/tutorial continuar`
Retoma o tutorial de onde você parou.

**Quando usar:**
- Parou no meio do tutorial
- Quer ver próximo step

**Exemplo:**
```
/tutorial continuar
```

### `/tutorial status`
Mostra seu progresso completo no tutorial.

**Exibe:**
- Barra de progresso visual
- Steps completados
- Recompensas já recebidas
- Próximo step
- Data de início/conclusão

**Exemplo:**
```
/tutorial status
```

### `/tutorial pular`
Pula o tutorial (pode retomar depois).

**Quando usar:**
- Já conhece o jogo
- Quer explorar livremente
- Pode retomar com `/tutorial continuar`

**Atenção:** Você perde as recompensas dos steps pulados!

**Exemplo:**
```
/tutorial pular
```

### `/tutorial ajuda [sistema]`
Exibe guias detalhados sobre sistemas específicos.

**Sistemas Disponíveis:**
- `gacha` - Sistema de invocação
- `battle` - Mecânicas de batalha
- `team` - Gerenciamento de equipes
- `equipment` - Equipamentos e stats
- `formation` - Elementos, posições e counters
- `arena` - PvP e ranking
- `raid` - Raids cooperativas
- `bossrush` - Boss Rush semanal
- `profile` - Personalização de perfil
- `economy` - Gold, Gems e Tickets

**Exemplo:**
```
/tutorial ajuda sistema:formation
/tutorial ajuda sistema:gacha
/tutorial ajuda
```

---

## 🤖 Integração Automática

O tutorial detecta automaticamente quando você completa objetivos e avança o progresso!

### Como Funciona

1. **Você usa um comando** (ex: `/invocar`)
2. **Sistema verifica** se você está no tutorial
3. **Se for o step atual**, avança automaticamente
4. **Mostra recompensas** via mensagem de acompanhamento
5. **Indica próximo step** com comando sugerido

### Comandos Integrados

| Comando | Step | Auto-detect |
|---------|------|-------------|
| `/invocar` | Step 2 | ✅ Sim |
| `/equipe adicionar` | Step 3 | ✅ Sim |
| `/equipe ordenar` | Step 3 | ✅ Sim |
| `/batalha` (vitória) | Step 4 | ✅ Sim |
| `/equipamento equipar` | Step 5 | ✅ Sim |
| `/arena` (vitória) | Step 6 | ✅ Sim |
| `/perfil bio` | Step 8 | ✅ Sim |
| `/perfil anime` | Step 8 | ✅ Sim |
| `/perfil cor` | Step 8 | ✅ Sim |
| `/perfil showcase` | Step 8 | ✅ Sim |
| `/perfil banner` | Step 8 | ✅ Sim |

### Exemplo de Fluxo

```
Jogador: /invocar
Bot: [Mostra resultado da invocação]
Bot: [Mensagem de acompanhamento]
     ✅ Tutorial - Step 2 Completo!
     🎁 Recompensas: 🎟️ 3 Tickets
     📚 Próximo: ⚔️ Monte Sua Equipe
     💡 Use /equipe definir para continuar!
```

---

## 📊 Sistema de Progresso

### Barra Visual

```
[████████░░] 8/10
```

### States Possíveis

- **Em Progresso** - Completando steps (0-9/10)
- **Completo** - Todos os 10 steps feitos ✅
- **Pulado** - Tutorial foi pulado ⏭️
- **Não Iniciado** - Ainda não começou

### Tracking

O sistema rastreia:
- ✅ Step atual
- ✅ Steps completados (array)
- ✅ Data de início
- ✅ Data de conclusão
- ✅ Se foi pulado
- ✅ Recompensas já reivindicadas

---

## 🔄 Fluxo Completo

### Para Novos Jogadores

```mermaid
1. Entrar no Discord
2. /tutorial iniciar
3. Clicar em "Começar Tutorial!"
4. Seguir os comandos sugeridos
5. Sistema auto-detecta progresso
6. Receber recompensas automaticamente
7. Completar todos os 10 steps
8. Receber personagem SSR garantido!
```

### Para Jogadores Experientes

```mermaid
1. /tutorial pular
2. Explorar livremente
3. (Opcional) /tutorial continuar para retomar
4. (Opcional) /tutorial ajuda para consultar sistemas
```

---

## 🎨 Categorias dos Steps

### Básico (Steps 1-3)
- Introdução ao jogo
- Primeiras ações
- Fundamentos

### Batalha (Steps 4-6)
- Combate PvE
- Equipamentos
- Arena PvP

### Avançado (Steps 7, 9)
- Raids cooperativas
- Boss Rush

### Personalização (Step 8)
- Customização de perfil

### Final (Step 10)
- Conclusão e recompensa épica

---

## 💡 Sistema de Ajuda

### Guias Disponíveis

#### 🎲 Gacha / Invocação
- Como funciona o sistema
- Banners e raridades
- Taxas de drop
- Invocações x1 vs x10

#### ⚔️ Sistema de Batalha
- Mecânicas de turnos
- Velocidade (SPD)
- Skills e Ultimates
- Status effects

#### 👥 Equipes
- Montar equipe (até 5)
- Comandos de gerenciamento
- Balance de roles
- Posições estratégicas

#### 🛡️ Equipamentos
- 5 slots por personagem
- Tipos de equipamento
- Stats boost
- Passivas especiais

#### 🔥 Formação
- 7 elementos (vantagens/desvantagens)
- 3 posições (Front/Mid/Back)
- Counters de roles
- Modificadores de dano

#### 🏆 Arena PvP
- Sistema adaptativo
- Ranking global
- Recompensas
- Estratégias

#### 🐉 Raids
- Batalhas cooperativas (até 5 jogadores)
- Bosses épicos
- Mecânicas especiais
- Dificuldades

#### 🔥 Boss Rush
- 5 bosses consecutivos
- Sem cura entre lutas
- Ranking semanal
- Recompensas escaláveis

#### 🎨 Perfil
- Bio e anime favorito
- Cor do embed
- Showcase (3 favoritos)
- Banner (imagem de fundo)

#### 💰 Economia
- Gold (moeda principal)
- Gems (premium)
- Tickets (gacha)
- Como conseguir recursos

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `user_tutorial`

```sql
CREATE TABLE user_tutorial (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  skipped BOOLEAN NOT NULL DEFAULT false,
  rewards_claimed JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
```

### Campos

- `current_step` - Step atual (0-10)
- `completed_steps` - Array de step IDs completados
- `is_completed` - Se completou todos os 10 steps
- `started_at` - Quando iniciou o tutorial
- `completed_at` - Quando completou (null se não completou)
- `skipped` - Se pulou o tutorial
- `rewards_claimed` - JSON com recompensas já reivindicadas

---

## 🔧 Arquitetura Técnica

### TutorialService

#### Funções Principais

```typescript
getTutorialProgress(discordId: string): Promise<TutorialProgress | null>
// Retorna progresso completo do jogador

startTutorial(discordId: string): Promise<Result>
// Inicia tutorial do zero

advanceTutorialStep(discordId: string, stepId: string): Promise<Result>
// Avança para próximo step e dá recompensas

skipTutorial(discordId: string): Promise<Result>
// Pula o tutorial

checkStepCompletion(discordId: string, stepId: string): Promise<boolean>
// Verifica se está no step atual (para auto-detect)

getStepByCommand(command: string): TutorialStep | null
// Retorna step relacionado ao comando
```

#### Recompensas

```typescript
// Step 1
{ gold: 1000 }

// Step 2
{ tickets: 3 }

// Step 3
{ gold: 1500 }

// Step 4
{ gold: 2000, gems: 10 }

// Step 5
{ gems: 25 }

// Step 6
{ gold: 2500, gems: 15 }

// Step 7
{ gold: 3000, gems: 20 }

// Step 8
{ gold: 2000, gems: 30 }

// Step 9
{ gold: 5000, gems: 50 }

// Step 10
{
  gold: 10000,
  gems: 100,
  tickets: 5,
  guaranteedCharacter: { rarity: "SSR" }
}
```

### Handlers

#### handleTutorialCommand
Processa todos os subcomandos do `/tutorial`

#### checkAndAdvanceTutorial
Função helper que verifica e avança tutorial automaticamente

```typescript
async function checkAndAdvanceTutorial(
  discordId: string,
  command: string,
  interaction: ChatInputCommandInteraction
): Promise<boolean>
```

Chamada em:
- `/invocar` (após summon bem-sucedido)
- `/equipe` (após adicionar/ordenar)
- `/batalha` (após vitória)
- `/equipamento equipar` (após equipar)
- `/arena` (após vitória)
- `/perfil` (após qualquer customização)

#### Button Interactions

Botões do tutorial:
- `tutorial_advance_{stepId}` - Avança para próximo step
- `tutorial_show_{stepId}` - Mostra detalhes de um step

---

## 📈 Estatísticas e Analytics

### Métricas Rastreadas

- Taxa de conclusão do tutorial
- Steps mais pulados
- Tempo médio para completar
- Recompensas distribuídas
- Jogadores que retomaram após pular

### Queries Úteis

```sql
-- Taxa de conclusão
SELECT 
  COUNT(*) FILTER (WHERE is_completed = true) * 100.0 / COUNT(*) as completion_rate
FROM user_tutorial;

-- Steps completados por jogador
SELECT 
  user_id,
  array_length(completed_steps, 1) as steps_completed
FROM user_tutorial
ORDER BY steps_completed DESC;

-- Tempo médio de conclusão
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600) as avg_hours
FROM user_tutorial
WHERE is_completed = true;
```

---

## 🎯 Boas Práticas

### Para Desenvolvedores

1. **Sempre testar auto-detect** - Verificar se `checkAndAdvanceTutorial` funciona
2. **Mensagens claras** - Embeds devem ser informativos
3. **Validar ordem** - Steps devem ser completados em sequência
4. **Recompensas imediatas** - Aplicar rewards via SQL increment
5. **Logs detalhados** - Rastrear progresso do tutorial

### Para Designers

1. **Progressão lógica** - Do simples ao complexo
2. **Recompensas motivadoras** - Aumentar progressivamente
3. **Objetivos claros** - Cada step tem objetivo bem definido
4. **Feedback imediato** - Mostrar progresso visualmente

### Para QA

1. **Testar cada step** - Completar tutorial completo
2. **Testar pular** - Verificar se pode retomar
3. **Testar auto-detect** - Cada comando integrado
4. **Testar recompensas** - Verificar se aplicam corretamente
5. **Testar edge cases** - Completar step já feito, pular steps

---

## 🐛 Troubleshooting

### Tutorial não avança automaticamente
**Causa:** Auto-detect pode não estar funcionando
**Solução:** Use `/tutorial continuar` manualmente

### Recompensas não aplicadas
**Causa:** Erro no SQL increment
**Solução:** Verificar logs do servidor, aplicar manualmente se necessário

### Não consigo pular tutorial
**Causa:** Já está completo ou pulado
**Solução:** Use `/tutorial status` para verificar state

### Botões não respondem
**Causa:** Interação expirou (>15min)
**Solução:** Use `/tutorial continuar` para obter novos botões

---

## 🚀 Melhorias Futuras

### Possíveis Adições

- [ ] Tutorial de cada sistema (mini-tutoriais)
- [ ] Conquistas por completar tutorial rapidamente
- [ ] Replay de steps para revisar
- [ ] Tutorial de eventos especiais
- [ ] Vídeos explicativos (links)
- [ ] Badges/emblemas de conclusão
- [ ] Leaderboard de conclusão mais rápida
- [ ] Tutorial em múltiplos idiomas
- [ ] Tutorial adaptativo (baseado em progresso)
- [ ] Hints contextuais (aparecem quando necessário)

---

## 📝 Changelog

### Versão 1.0.0 (Atual)
- ✅ 10 steps completos
- ✅ Auto-detect em 7 comandos
- ✅ Sistema de recompensas progressivas
- ✅ Personagem SSR garantido
- ✅ Sistema de ajuda com 10 guias
- ✅ Progresso rastreável
- ✅ Pode pular e retomar
- ✅ Botões interativos
- ✅ Integração completa com handlers

---

## 🎓 Exemplos de Uso

### Fluxo Completo - Novo Jogador

```
1. Jogador entra no Discord
2. Bot sugere: "Use /tutorial iniciar para começar!"
3. Jogador: /tutorial iniciar
4. Bot mostra Step 1 com botão
5. Jogador clica "Começar Tutorial!"
6. Bot dá 1,000 gold e mostra Step 2
7. Jogador: /invocar
8. Bot detecta e avança automaticamente Step 2
9. Bot dá 3 tickets e sugere /equipe
10. Jogador: /equipe adicionar
11. Bot detecta e avança Step 3
... (continua até Step 10)
12. Bot dá personagem SSR + 10k gold + 100 gems
13. Tutorial completo! 🎉
```

### Consulta Rápida - Jogador Experiente

```
1. Jogador: /tutorial pular
2. Bot: "Tutorial pulado. Use /tutorial ajuda quando precisar!"
3. [Jogador joga livremente]
4. Jogador: /tutorial ajuda sistema:formation
5. Bot mostra guia completo de formação
6. Jogador aprende sobre elementos e posições
```

---

## 📞 Suporte

Para problemas ou dúvidas sobre o tutorial:

1. **In-game:** `/tutorial ajuda`
2. **Status:** `/tutorial status`
3. **Retomar:** `/tutorial continuar`

---

## ✅ Checklist de Implementação

- [x] Migration 0010 criada
- [x] Schema atualizado (userTutorial)
- [x] TutorialService completo
- [x] 10 steps definidos com recompensas
- [x] Comando `/tutorial` com 5 subcomandos
- [x] Auto-detect em 7 comandos
- [x] Botões interativos
- [x] Sistema de ajuda (10 guias)
- [x] Progresso visual (barra)
- [x] Recompensas progressivas
- [x] Personagem SSR garantido
- [x] Pode pular e retomar
- [x] Documentação completa

---

## 🎉 Conclusão

O Sistema de Tutorial Interativo oferece uma experiência completa e envolvente para novos jogadores, com:

- **📚 Aprendizado Progressivo** - 10 steps do básico ao avançado
- **🎁 Recompensas Generosas** - 29k gold, 260 gems, 8 tickets, SSR
- **🤖 Detecção Automática** - Avança sozinho quando completa objetivos
- **💡 Sistema de Ajuda** - Guias detalhados sempre disponíveis
- **🎨 Experiência Polida** - Embeds bonitos, botões interativos, feedback claro

**Resultado:** Novos jogadores aprendem o jogo de forma natural e são recompensados generosamente, aumentando engajamento e retenção! 🚀
