# 🤖 Anime RPG Discord Bot - Deploy Discloud

## ⚡ Deploy Rápido (3 Passos)

### 1️⃣ Preparar Ambiente

```bash
pnpm install
node lib/db/scripts/apply-all-migrations.mjs
cd artifacts/api-server && node build.mjs && cd ../..
```

### 2️⃣ Configurar Variáveis

No painel da Discloud, adicione:

```env
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 3️⃣ Upload

1. Criar ZIP com: `dist/`, `node_modules/`, `discloud.config`, `package.json`
2. Upload no [Discloud Dashboard](https://discloud.app/dashboard)
3. Iniciar o bot

**Pronto! Bot online em 2 minutos! 🚀**

---

## 📋 Configuração `discloud.config`

```ini
ID=                    # Deixe vazio (preenchido pela Discloud)
TYPE=bot              # Tipo de aplicação
MAIN=artifacts/api-server/dist/bot/index.mjs  # Arquivo principal
NAME=Anime RPG Discord Bot                     # Nome do bot
AVATAR=https://i.imgur.com/7MWtxq8.png       # Avatar (opcional)
RAM=200               # Memória RAM em MB (100, 200, 512, 1024)
AUTORESTART=true      # Reinicia automaticamente se cair
VERSION=latest        # Versão do Node.js
APT=tools             # Ferramentas extras
```

---

## 🎯 RAM Recomendada

| Uso | RAM | Plano |
|-----|-----|-------|
| Teste/Pequeno | 100 MB | Free |
| Médio (até 10 servidores) | 200 MB | Free/Premium |
| Grande (10-50 servidores) | 512 MB | Premium |
| Muito Grande (50+ servidores) | 1024 MB | Premium+ |

---

## 🔧 Comandos Úteis

### Build do Projeto
```bash
cd artifacts/api-server
node build.mjs
```

### Aplicar Migrations
```bash
node lib/db/scripts/apply-all-migrations.mjs
```

### Testar Localmente
```bash
pnpm start
```

---

## 📦 Estrutura para Upload

```
✅ artifacts/api-server/dist/    (código compilado)
✅ lib/db/drizzle/               (migrations)
✅ lib/db/scripts/               (scripts)
✅ node_modules/                 (dependências)
✅ discloud.config
✅ package.json
✅ pnpm-lock.yaml

❌ .git/
❌ artifacts/api-server/src/     (código TypeScript)
❌ .env
❌ *.md
```

---

## 🐛 Problemas Comuns

### "Cannot find module"
→ Inclua `node_modules/` no ZIP

### "Unknown interaction"
→ Aguarde 10 min para Discord sincronizar

### Bot não conecta ao banco
→ Verifique `DATABASE_URL` nas variáveis de ambiente

### RAM insuficiente
→ Aumente RAM no `discloud.config`

---

## 📚 Documentação Completa

Veja `DEPLOY_DISCLOUD.md` para guia detalhado!

---

## 🎮 Comandos do Bot

Após deploy, teste:

```
/tutorial iniciar
/perfil ver
/invocar
/personagens
/arena
/bossrush iniciar
```

---

## 🔗 Links Importantes

- [Discloud Dashboard](https://discloud.app/dashboard)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Neon Database (Grátis)](https://neon.tech)
- [Supabase (Grátis)](https://supabase.com)

---

**Deploy em 2 minutos! 🚀**
