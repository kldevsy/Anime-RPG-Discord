# 🚀 Deploy na Discloud - Guia Completo

## 📋 Pré-requisitos

Antes de começar, você precisa ter:

- ✅ Conta na [Discloud](https://discloud.app)
- ✅ Bot do Discord criado no [Discord Developer Portal](https://discord.com/developers/applications)
- ✅ Banco de dados PostgreSQL (pode usar [Neon](https://neon.tech) ou [Supabase](https://supabase.com) - gratuito)

---

## 🔧 Configuração Inicial

### 1. Clonar/Baixar o Projeto

```bash
git clone <seu-repositorio>
cd Anime-RPG-Discord
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Discord
DISCORD_TOKEN=seu_token_do_bot_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui

# Database (PostgreSQL)
DATABASE_URL=postgresql://usuario:senha@host:5432/database

# Opcional
NODE_ENV=production
```

### 3. Obter Token do Discord

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecione seu bot ou crie um novo
3. Vá em **Bot** → **Reset Token** → Copie o token
4. Cole no `.env` em `DISCORD_TOKEN`
5. Copie o **Application ID** e cole em `DISCORD_CLIENT_ID`

### 4. Configurar Banco de Dados PostgreSQL

#### Opção A: Neon (Recomendado - Gratuito)

1. Acesse [Neon.tech](https://neon.tech)
2. Crie uma conta e um novo projeto
3. Copie a **Connection String** (formato: `postgresql://user:pass@host/db`)
4. Cole no `.env` em `DATABASE_URL`

#### Opção B: Supabase (Gratuito)

1. Acesse [Supabase](https://supabase.com)
2. Crie um projeto
3. Vá em **Settings** → **Database** → **Connection String** → **URI**
4. Copie e cole no `.env` em `DATABASE_URL`

#### Opção C: Outro provedor

Qualquer PostgreSQL funciona! Basta ter a connection string no formato:
```
postgresql://usuario:senha@host:porta/database
```

---

## 🏗️ Preparar para Deploy

### Método 1: Script Automático (Recomendado)

```bash
# Linux/Mac
chmod +x prepare-discloud.sh
./prepare-discloud.sh

# Windows (Git Bash)
bash prepare-discloud.sh

# Windows (PowerShell)
pnpm install
node lib/db/scripts/apply-all-migrations.mjs
cd artifacts/api-server
node build.mjs
cd ../..
```

### Método 2: Passo a Passo

```bash
# 1. Instalar dependências
pnpm install

# 2. Aplicar migrations
node lib/db/scripts/apply-all-migrations.mjs

# 3. Build do projeto
cd artifacts/api-server
node build.mjs
cd ../..
```

---

## 📦 Upload para Discloud

### Passo 1: Criar ZIP do Projeto

**Importante:** Não zipar a pasta do projeto, zipar apenas o CONTEÚDO!

**Incluir:**
- ✅ `artifacts/api-server/dist/` (pasta compilada)
- ✅ `lib/db/drizzle/` (migrations)
- ✅ `lib/db/scripts/` (scripts de migration)
- ✅ `node_modules/` (dependências)
- ✅ `discloud.config`
- ✅ `package.json`
- ✅ `pnpm-lock.yaml`

**Não incluir:**
- ❌ `.git/`
- ❌ `artifacts/api-server/src/` (código TypeScript)
- ❌ `.env` (variáveis vão no painel)
- ❌ `*.md` (documentação)
- ❌ `.vscode/`, `.idea/`

### Passo 2: Upload na Discloud

1. Acesse [Discloud Dashboard](https://discloud.app/dashboard)
2. Clique em **Adicionar App**
3. Selecione **Bot**
4. Faça upload do ZIP
5. Aguarde o upload (pode demorar alguns minutos)

### Passo 3: Configurar Variáveis de Ambiente

No painel da Discloud:

1. Vá em **Configurações** do seu bot
2. Adicione as variáveis:
   ```
   DISCORD_TOKEN=seu_token_aqui
   DISCORD_CLIENT_ID=seu_client_id_aqui
   DATABASE_URL=sua_connection_string_postgresql
   NODE_ENV=production
   ```
3. Clique em **Salvar**

### Passo 4: Iniciar Bot

1. Clique em **Iniciar** ou **Restart**
2. Aguarde 1-2 minutos
3. Verifique os **Logs** para confirmar que iniciou

---

## 🔍 Verificar se Está Funcionando

### No Discord

1. Convide seu bot para um servidor
2. Use os comandos:
   ```
   /tutorial iniciar
   /perfil ver
   /personagens
   /invocar
   ```

### Nos Logs da Discloud

Você deve ver:
```
[INFO] Bot logged in as: NomeDoSeuBot#1234
[INFO] Connected to database
[INFO] Commands registered: 21
```

---

## 🐛 Troubleshooting

### Bot não inicia

**Problema:** "Cannot find module"
**Solução:** Certifique-se de incluir `node_modules/` no ZIP ou use `pnpm install` antes do upload

**Problema:** "DATABASE_URL not defined"
**Solução:** Configure as variáveis de ambiente no painel da Discloud

**Problema:** "Unknown interaction"
**Solução:** Aguarde 5-10 minutos para Discord sincronizar comandos

### Bot desconecta frequentemente

**Problema:** RAM insuficiente
**Solução:** Aumente RAM no `discloud.config`:
```
RAM=200
```
ou
```
RAM=512
```

### Migrations não aplicadas

**Problema:** Tabelas não existem
**Solução:** Execute migrations manualmente:

1. Conecte ao banco via psql ou ferramenta
2. Execute os arquivos em `lib/db/drizzle/` na ordem:
   ```sql
   \i 0001_...sql
   \i 0002_...sql
   ...
   \i 0010_tutorial_system.sql
   ```

### Comandos não aparecem

**Problema:** Comandos não sincronizados
**Solução:** 
1. Aguarde 10 minutos
2. Restart o bot na Discloud
3. Verifique se `DISCORD_CLIENT_ID` está correto

---

## 📊 Monitoramento

### Logs em Tempo Real

No painel da Discloud:
1. Vá em **Logs**
2. Veja logs em tempo real
3. Procure por erros

### Status do Bot

```
🟢 Online - Bot funcionando
🟡 Iniciando - Aguarde 1-2 min
🔴 Offline - Verifique logs
```

---

## 🔄 Atualizar o Bot

### Quando fizer mudanças no código:

```bash
# 1. Build
cd artifacts/api-server
node build.mjs
cd ../..

# 2. Aplicar novas migrations (se houver)
node lib/db/scripts/apply-all-migrations.mjs

# 3. Criar novo ZIP

# 4. Upload na Discloud (substituir)

# 5. Restart o bot
```

---

## 💰 Planos Discloud

### Free Plan
- ✅ 100 MB RAM
- ✅ 24/7 uptime
- ✅ Suporte básico
- ⚠️ Pode ser lento com muitos usuários

### Premium Plans
- 🚀 Mais RAM (200MB, 512MB, 1GB+)
- 🚀 Melhor performance
- 🚀 Prioridade no suporte

**Recomendação:** Comece com Free, upgrade se necessário

---

## 🎯 Checklist de Deploy

- [ ] Bot criado no Discord Developer Portal
- [ ] Token e Client ID copiados
- [ ] Banco PostgreSQL configurado (Neon/Supabase)
- [ ] Connection string obtida
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Migrations aplicadas
- [ ] Build compilado
- [ ] ZIP criado corretamente
- [ ] Upload feito na Discloud
- [ ] Variáveis de ambiente configuradas
- [ ] Bot iniciado
- [ ] Comandos testados no Discord

---

## 📝 Estrutura Final do ZIP

```
anime-rpg-discord.zip
│
├── artifacts/
│   └── api-server/
│       └── dist/              # ✅ Código compilado
│           ├── bot/
│           │   └── index.mjs  # ✅ Entry point
│           └── services/
│
├── lib/
│   └── db/
│       ├── drizzle/          # ✅ Migrations SQL
│       └── scripts/          # ✅ Scripts de migration
│
├── node_modules/             # ✅ Dependências
│
├── discloud.config           # ✅ Configuração Discloud
├── package.json              # ✅ Dependências do projeto
└── pnpm-lock.yaml            # ✅ Lock file
```

**Tamanho estimado:** 50-100 MB

---

## 🎉 Pronto!

Seu bot agora está rodando 24/7 na Discloud! 🚀

### Próximos Passos

1. **Convide para servidores:** Use o OAuth2 URL Generator
2. **Monitore logs:** Veja se há erros
3. **Teste comandos:** `/tutorial iniciar`, `/perfil`, etc
4. **Customize:** Adicione mais features!

### Suporte

- **Discloud:** [Discord da Discloud](https://discord.gg/discloud)
- **Bot:** Verifique logs para erros específicos
- **Database:** Suporte do provedor (Neon/Supabase)

---

## 🔗 Links Úteis

- [Discloud Dashboard](https://discloud.app/dashboard)
- [Discloud Docs](https://docs.discloud.app)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Neon Database](https://neon.tech)
- [Supabase](https://supabase.com)

**Boa sorte com seu bot! 🎮**
