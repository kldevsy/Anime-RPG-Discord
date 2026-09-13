# 🚀 Deploy Discloud - Guia Definitivo

## ❌ Problema Identificado

O erro **"arquivo principal não foi encontrado"** acontece porque:
1. ❌ A pasta `dist/` **não existe** no seu repositório local
2. ❌ Você não tem Node.js instalado localmente para buildar
3. ✅ **SOLUÇÃO**: Deixar o Discloud buildar automaticamente!

---

## ✅ Solução Definitiva (3 passos)

### 1️⃣ Fazer commit dos arquivos necessários

```bash
# Adicionar arquivos de configuração
git add discloud.config package.json .discloudignore

# Adicionar TODO o código fonte
git add artifacts/ lib/

# Commit
git commit -m "Deploy para Discloud - source code"

# Push para GitHub
git push origin main
```

### 2️⃣ Baixar ZIP do GitHub

1. Acesse seu repositório no GitHub
2. Clique em: **Code** → **Download ZIP**
3. Salve o arquivo (será algo como `Anime-RPG-Discord-main.zip`)

### 3️⃣ Fazer upload no Discloud

1. Acesse: https://discloud.app/dashboard
2. Clique em: **Upload Bot**
3. Selecione o ZIP do GitHub
4. Configure as variáveis de ambiente:

```env
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DATABASE_URL=postgresql://usuario:senha@host:5432/database
```

5. **Clique em "Start"**
6. **Aguarde 10-15 minutos** (Discloud vai instalar deps + compilar)

---

## 🔧 Como funciona

O Discloud executa automaticamente:

```bash
# 1. Instala dependências
pnpm install

# 2. Compila o código (script "prepare" no package.json)
node artifacts/api-server/build.mjs

# 3. Inicia o bot
node --enable-source-maps ./artifacts/api-server/dist/bot/index.mjs
```

---

## 📋 Checklist Pré-Deploy

- [ ] ✅ Commit de `discloud.config` (MAIN aponta para source .ts)
- [ ] ✅ Commit de `package.json` (tem script "prepare")
- [ ] ✅ Commit de `.discloudignore` (exclui node_modules)
- [ ] ✅ Commit de `artifacts/api-server/src/**` (código fonte)
- [ ] ✅ Commit de `lib/db/**` (database + migrations)
- [ ] ✅ Push para GitHub
- [ ] ✅ Download ZIP do GitHub
- [ ] ✅ Upload no Discloud
- [ ] ✅ Configurar env vars (DISCORD_TOKEN, DATABASE_URL)
- [ ] ✅ Aguardar build (10-15 min)

---

## 🎯 Por que o ZIP do GitHub funciona?

| Método | Tamanho | Status |
|--------|---------|--------|
| ZIP Local (com node_modules) | **150+ MB** | ❌ Muito grande |
| ZIP GitHub (sem node_modules) | **~20 MB** | ✅ Funciona |

O GitHub **não inclui node_modules** no ZIP, então:
- ✅ Fica dentro do limite de 100 MB
- ✅ Discloud instala as dependências automaticamente
- ✅ Discloud compila o código via script "prepare"

---

## 🐛 Troubleshooting

### Erro: "arquivo principal não encontrado"

**Causa**: MAIN no discloud.config aponta para arquivo que não existe

**Solução**: Verificar que MAIN aponta para o source code:
```
MAIN=artifacts/api-server/src/bot/index.ts
```

### Erro: "Cannot find module"

**Causa**: Dependências não instaladas

**Solução**: Aguardar mais tempo (Discloud ainda está instalando)

### Erro: "Build failed"

**Causa**: Erro de compilação no código

**Solução**: 
1. Ver logs no dashboard do Discloud
2. Corrigir erro no código
3. Fazer novo commit + push
4. Re-upload do ZIP

### Bot não inicia após 15 minutos

**Causa**: Variáveis de ambiente faltando

**Solução**: Verificar que você configurou:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`  
- `DATABASE_URL`

---

## 📊 Tamanho do ZIP

O ZIP do GitHub deve ter aproximadamente:

```
artifacts/           ~15 MB
lib/                 ~3 MB
node_modules/        (não incluído)
package.json         2 KB
discloud.config      200 bytes
-----------------------------------
TOTAL:              ~18-20 MB ✅
```

---

## 🎉 Deploy Bem-sucedido

Quando funcionar, você verá nos logs:

```
[Discloud] Installing dependencies...
[Discloud] Running prepare script...
[Discloud] Build complete!
[Discloud] Starting bot...
[BOT] 🤖 Bot conectado como: Anime RPG#1234
[BOT] 🔥 Bot online em 1 servidor(s)
```

---

## 💡 Dica Pro

Para deploys futuros, basta:

1. Fazer alterações no código
2. `git add . && git commit -m "update"`
3. `git push origin main`
4. Baixar novo ZIP do GitHub
5. Re-upload no Discloud

**Não precisa buildar localmente!** 🚀
