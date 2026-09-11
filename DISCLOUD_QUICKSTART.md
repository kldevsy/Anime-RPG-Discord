# ⚡ Discloud - Quick Start

## 🚀 3 Passos para Deploy

### 1. Preparar

**Linux/Mac:**
```bash
chmod +x prepare-discloud.sh
./prepare-discloud.sh
```

**Windows (PowerShell):**
```powershell
.\prepare-discloud.ps1
```

**Ou manualmente:**
```bash
pnpm install
node lib/db/scripts/apply-all-migrations.mjs
cd artifacts/api-server && node build.mjs && cd ../..
```

### 2. Criar ZIP

**Incluir:**
- ✅ `artifacts/api-server/dist/`
- ✅ `lib/db/drizzle/`
- ✅ `lib/db/scripts/`
- ✅ `node_modules/`
- ✅ `discloud.config`
- ✅ `package.json`
- ✅ `pnpm-lock.yaml`

**Excluir:**
- ❌ `.git/`
- ❌ `artifacts/api-server/src/`
- ❌ `.env`
- ❌ `*.md`

### 3. Deploy

1. **Acesse:** [discloud.app/dashboard](https://discloud.app/dashboard)
2. **Upload:** Envie o ZIP
3. **Variáveis de Ambiente:**
   ```
   DISCORD_TOKEN=seu_token
   DISCORD_CLIENT_ID=seu_client_id
   DATABASE_URL=postgresql://...
   ```
4. **Iniciar:** Clique em Start

---

## 🎯 discloud.config

```ini
TYPE=bot
MAIN=artifacts/api-server/dist/bot/index.mjs
NAME=Anime RPG Discord Bot
RAM=200
AUTORESTART=true
VERSION=latest
```

---

## 🗄️ Banco de Dados (Grátis)

### Opção A: Neon
1. [neon.tech](https://neon.tech) → Criar conta
2. Criar projeto
3. Copiar Connection String
4. Colar em `DATABASE_URL`

### Opção B: Supabase
1. [supabase.com](https://supabase.com) → Criar conta
2. Criar projeto
3. Settings → Database → Connection String (URI)
4. Colar em `DATABASE_URL`

---

## 🔍 Testar

No Discord:
```
/tutorial iniciar
/perfil ver
/invocar
/personagens
```

---

## 🐛 Problemas?

| Erro | Solução |
|------|---------|
| Module not found | Incluir `node_modules/` no ZIP |
| Unknown interaction | Aguardar 10 min |
| Database error | Verificar `DATABASE_URL` |
| RAM insuficiente | Aumentar RAM para 200 ou 512 |

---

## 📚 Docs Completas

- `DEPLOY_DISCLOUD.md` - Guia detalhado
- `README_DISCLOUD.md` - Referência rápida

---

**Deploy em 5 minutos! 🎮**
