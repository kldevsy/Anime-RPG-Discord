# 🧪 Como Testar o Sistema de Loot Box

## ✅ VERIFICAÇÃO PRÉ-TESTE

### Arquivos Implementados:
- [x] `lib/db/src/schema/index.ts` - Schema com 4 tabelas
- [x] `artifacts/api-server/src/services/LootBoxService.ts` - Service completo
- [x] `artifacts/api-server/src/bot/embeds.ts` - 4 embeds
- [x] `artifacts/api-server/src/bot/commands.ts` - Comandos /loja e /lootbox
- [x] `artifacts/api-server/src/bot/handlers.ts` - Handlers nas linhas ~1318-1519

---

## 🚀 PASSO A PASSO PARA TESTAR

### 1. Gerar e Aplicar Migration

```bash
cd lib/db
pnpm drizzle-kit generate
pnpm run migrate
```

**Resultado esperado:**
```
✔ Generating...
✔ Migration lootbox_system_XXXXXX.sql created

✔ Applying migrations...
✔ 4 tables created:
  - loot_box_openings
  - loot_box_pity
  - daily_free_box
  - mastery_xp_inventory
```

---

### 2. Iniciar o Bot

```bash
cd ~/workspace
pnpm --filter @workspace/api-server run bot
```

**Resultado esperado:**
```
[startup-sync] Database migrations are up to date.
[startup-sync] Synchronizing the character catalog...
[startup-sync] Equipment catalog synchronized successfully.
Bot is ready! Logged in as [BotName]
```

---

### 3. Testar Comandos no Discord

#### Teste 1: Ver Loja 🏪
```
/loja
```

**Resultado esperado:**
- Embed mostrando 5 tipos de caixas
- Preços em gemas
- Seu saldo de gemas
- Contadores de pity
- Status de caixa grátis

**Verificar:**
- ✅ Todos os 5 tipos aparecem
- ✅ Preços corretos (50, 150, 400, 1000, 2500)
- ✅ Pity começa em 0/10
- ✅ Caixa grátis mostra "Disponível"

---

#### Teste 2: Abrir Caixa Básica 💚
```
/lootbox abrir tipo:Básica
```

**Resultado esperado:**
- Deduz 50 gemas
- Mostra 3 recompensas
- Embed colorido
- Pity aumenta para 1/10

**Verificar:**
- ✅ Gemas deduzidas
- ✅ Recompensas aleatórias
- ✅ Pelo menos: Gold, Tickets, Equipment
- ✅ Pity atualizado

---

#### Teste 3: Abrir Múltiplas Caixas 📦
```
/lootbox abrir tipo:Básica quantidade:10
```

**Resultado esperado:**
- Deduz 500 gemas (10x 50)
- Mostra resumo de todas as recompensas
- Pity pode resetar se tiver item raro

**Verificar:**
- ✅ Gemas deduzidas (500)
- ✅ Todas as 10 caixas processadas
- ✅ Resumo consolidado
- ✅ Pity atualizado corretamente

---

#### Teste 4: Caixa Grátis Diária 🎁
```
/lootbox diaria
```

**Resultado esperado:**
- Embed de suspense
- Delay de 1.5s
- 3 recompensas
- Não deduz gemas
- Não conta para pity

**Verificar:**
- ✅ Sem custo
- ✅ Recompensas grátis
- ✅ Só pode usar 1x por dia
- ✅ Mensagem de erro se tentar de novo

---

#### Teste 5: Ver Histórico 📊
```
/lootbox historico
```

**Resultado esperado:**
- Lista das últimas 20 aberturas
- Total de caixas abertas
- Total de gemas gastas
- Contagem de jackpots

**Verificar:**
- ✅ Histórico aparece
- ✅ Estatísticas corretas
- ✅ Timestamps formatados
- ✅ Tipos de caixa identificados

---

#### Teste 6: Tentar Sem Gemas ❌
```
/lootbox abrir tipo:Mítica
```
(Se não tiver 2500 gemas)

**Resultado esperado:**
```
❌ Você não tem gemas suficientes!
Necessário: 2500 💎
Você tem: XXX 💎
```

**Verificar:**
- ✅ Erro claro
- ✅ Não deduz nada
- ✅ Mostra saldo

---

#### Teste 7: Sistema de Pity 🎯

**Abrir 10 caixas do mesmo tipo:**
```
/lootbox abrir tipo:Avançada quantidade:10
```

**Resultado esperado:**
- Nas primeiras 5: chance normal
- Entre 5-10: soft pity (+20% chance de raro)
- Na 10ª: hard pity (GARANTIA de item raro)
- Pity reseta ao obter item raro

**Verificar:**
- ✅ Contador aumenta
- ✅ Na 10ª caixa, item raro SEMPRE aparece
- ✅ Pity reseta após item raro
- ✅ Visual de "PITY ATIVADO!" no embed

---

#### Teste 8: Jackpot 🎰
(Difícil de testar, 0.1% chance)

**Se acertar:**
```
🎰 JACKPOT! 🎰
Todas as recompensas foram DOBRADAS!
```

**Verificar:**
- ✅ Todas as quantidades dobradas
- ✅ Visual especial no embed
- ✅ Contador de jackpot aumenta

---

#### Teste 9: Tentar Diária Novamente ⏰
```
/lootbox diaria
```
(Depois de já ter usado hoje)

**Resultado esperado:**
```
❌ Você já reivindicou sua caixa grátis hoje! 
Volte em 24h.
```

**Verificar:**
- ✅ Erro claro
- ✅ Não dá recompensa
- ✅ Diz quando pode usar de novo

---

#### Teste 10: XP Acumulado (Placeholder) ⚠️
```
/lootbox aplicar-xp personagem:Naruto
```

**Resultado esperado:**
```
⚠️ Sistema de XP de Maestria acumulado ainda não está implementado!

Em breve você poderá:
• Acumular XP de Maestria de loot boxes
• Aplicar em personagens da sua equipe
• Subir múltiplos níveis de maestria de uma vez
```

**Verificar:**
- ✅ Mensagem clara
- ✅ Não quebra
- ✅ Explica o futuro

---

## 🔍 VERIFICAÇÕES NO BANCO DE DADOS

### Após os testes, verificar:

```sql
-- Ver aberturas
SELECT * FROM loot_box_openings 
ORDER BY opened_at DESC 
LIMIT 10;

-- Ver contadores de pity
SELECT * FROM loot_box_pity;

-- Ver histórico de caixas grátis
SELECT * FROM daily_free_box;

-- Ver XP acumulado (deve estar vazio ainda)
SELECT * FROM mastery_xp_inventory;
```

**Verificar:**
- ✅ Registros criados corretamente
- ✅ Timestamps corretos
- ✅ Recompensas em JSON
- ✅ Pity atualizado

---

## ⚠️ POSSÍVEIS ERROS E SOLUÇÕES

### Erro: "Cannot find module LootBoxService"
**Solução:**
```bash
cd artifacts/api-server
pnpm run build
```

### Erro: "Table does not exist"
**Solução:**
```bash
cd lib/db
pnpm run migrate
```

### Erro: "Command not found /loja or /lootbox"
**Solução:**
- Verificar se comandos foram registrados
- Reiniciar bot
- Aguardar alguns minutos (cache do Discord)

### Erro: "Cannot read property 'gems'"
**Solução:**
- Usuário precisa ter perfil
- Executar `/perfil` primeiro

---

## 📊 CHECKLIST DE TESTES

### Funcionalidades Básicas:
- [ ] `/loja` mostra todos os tipos
- [ ] Gemas são deduzidas corretamente
- [ ] Recompensas são geradas
- [ ] Recompensas são aplicadas ao inventário
- [ ] Histórico é registrado

### Sistema de Pity:
- [ ] Contador aumenta a cada abertura
- [ ] Soft pity ativa em 5
- [ ] Hard pity garante raro em 10
- [ ] Pity reseta ao obter item raro
- [ ] Pity é separado por tipo

### Sistema de Jackpot:
- [ ] 0.1% de chance (difícil testar)
- [ ] Dobra todas as recompensas
- [ ] Visual especial
- [ ] Contador atualiza

### Caixa Grátis:
- [ ] Funciona sem custo
- [ ] Só 1x por dia
- [ ] Reseta em 24h
- [ ] Não conta para pity

### Múltiplas Caixas:
- [ ] Abre várias de uma vez
- [ ] Resume recompensas
- [ ] Calcula custo total
- [ ] Atualiza pity corretamente

### Histórico:
- [ ] Mostra últimas 20
- [ ] Estatísticas corretas
- [ ] Formato legível

### Validações:
- [ ] Erro se sem gemas
- [ ] Erro se já usou diária
- [ ] Erro se tipo inválido
- [ ] Erro se quantidade inválida

---

## ✅ TESTE COMPLETO PASSOU?

Se todos os testes acima passaram:

🎉 **SISTEMA DE LOOT BOX 100% FUNCIONAL!**

Próximos passos:
1. Documentar bugs encontrados
2. Ajustar balanceamento (se necessário)
3. Implementar features futuras (XP acumulado, etc)

---

## 🎮 FLUXO DE TESTE RÁPIDO

```bash
# Terminal 1: Preparar
cd lib/db
pnpm drizzle-kit generate
pnpm run migrate

# Terminal 1: Rodar bot
cd ~/workspace
pnpm --filter @workspace/api-server run bot

# Discord: Testar
/loja
/lootbox abrir tipo:Básica
/lootbox abrir tipo:Básica quantidade:10
/lootbox diaria
/lootbox historico
/lootbox diaria (deve dar erro)

# Verificar resultados!
```

**Tempo estimado:** 5-10 minutos

---

## 🚀 BOM TESTE!

Sistema está completo e pronto!
Qualquer erro, verificar documentação acima. 🎁✨
