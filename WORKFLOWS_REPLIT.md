# 🚀 Workflows da Replit - Guia Rápido

## 📋 Workflows Disponíveis

### 1️⃣ **Start Bot** (Botão RUN padrão)
**O que faz:**
1. Aplica migrations automaticamente
2. Faz build do código
3. Inicia o bot Discord

**Quando usar:**
- Primeira vez que inicia o projeto
- Após fazer mudanças no código
- Quando quer garantir que tudo está atualizado

**Atalho:** Pressione o botão verde **"Run"** ▶️

---

### 2️⃣ **Apply Migrations**
**O que faz:**
- Aplica todas as migrations do banco de dados
- Cria tabelas novas (user_profiles, boss_rush, etc)
- Atualiza schema existente

**Quando usar:**
- Quando adicionar novas features que precisam de banco
- Depois de fazer pull de mudanças no schema
- Se algum comando der erro de "table não existe"

---

### 3️⃣ **Build Only**
**O que faz:**
- Compila o TypeScript para JavaScript
- Valida sintaxe do código
- Não inicia o bot

**Quando usar:**
- Testar se o código compila
- Verificar erros de sintaxe
- Antes de fazer commit

---

### 4️⃣ **Quick Restart**
**O que faz:**
- Reinicia o bot usando o build anterior
- Não faz rebuild nem migrations
- Mais rápido (5 segundos)

**Quando usar:**
- Bot travou mas código não mudou
- Quer reiniciar rápido
- Testar mudanças no banco sem recompilar

---

### 5️⃣ **Full Restart**
**O que faz:**
- Aplica migrations
- Faz build completo
- Inicia o bot

**Quando usar:**
- Mudou código E schema do banco
- Quer garantir que está 100% atualizado
- Depois de adicionar novas features

---

### 6️⃣ **Seed Characters**
**O que faz:**
- Atualiza catálogo de personagens
- Sincroniza personagens do código com o banco
- Adiciona novos personagens

**Quando usar:**
- Adicionou novos personagens em `characters.ts`
- Mudou stats de personagens existentes
- Primeira vez configurando o projeto

---

## 🎯 Fluxo Recomendado

### Primeira vez no projeto:
```
1. Full Restart
2. Seed Characters
3. Pronto! Bot funcionando
```

### Desenvolvimento diário:
```
1. Fez mudança no código → Start Bot
2. Bot travou → Quick Restart
3. Mudou schema → Apply Migrations → Build Only → Quick Restart
```

### Deploy/Produção:
```
Full Restart (sempre)
```

---

## 🐛 Troubleshooting

### Erro: "table não existe"
→ Use **Apply Migrations**

### Erro: "Cannot find module"
→ Use **Build Only** depois **Quick Restart**

### Bot não responde
→ Use **Quick Restart**

### Mudou muita coisa
→ Use **Full Restart**

### Personagens desatualizados
→ Use **Seed Characters**

---

## 💡 Dicas

- **Botão RUN verde** = Start Bot (padrão)
- **Workflows no menu lateral** = Todas as opções
- **Ctrl + C** = Para o bot (quando necessário)
- **Logs coloridos** = Indica o que está acontecendo

---

## 📝 Ordem de Execução

**Start Bot:**
```
Migrations → Build → Start
```

**Full Restart:**
```
Migrations → Build → Start
```

**Quick Restart:**
```
Start (usa build existente)
```

---

## 🎮 Comandos Manuais (se preferir)

```bash
# Migrations
node lib/db/scripts/apply-all-migrations.mjs

# Build
cd artifacts/api-server && node build.mjs

# Start
cd artifacts/api-server && node --enable-source-maps ./dist/bot/index.mjs

# Tudo junto
node lib/db/scripts/apply-all-migrations.mjs && \
cd artifacts/api-server && \
node build.mjs && \
node --enable-source-maps ./dist/bot/index.mjs
```

---

## ✅ Checklist Pré-Deploy

- [ ] Apply Migrations executou sem erros
- [ ] Build Only compilou com sucesso
- [ ] Seed Characters atualizou personagens
- [ ] Quick Restart iniciou o bot
- [ ] Testou comandos no Discord

**Tudo OK? Deploy! 🚀**
