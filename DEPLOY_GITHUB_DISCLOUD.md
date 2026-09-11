# 🚀 Deploy GitHub → Discloud (Sem ZIP de 100MB!)

## 🎯 Solução para o Problema do Tamanho

**Problema:** ZIP com node_modules > 100 MB (limite da Discloud Free)  
**Solução:** Deploy direto do GitHub! A Discloud instala as dependências automaticamente.

---

## 📋 Passo a Passo Completo

### 1️⃣ Fazer Commit do Código Compilado

```bash
# Na raiz do projeto
cd ~/workspace

# Build do projeto
cd artifacts/api-server
node build.mjs
cd ../..

# Adicionar arquivos compilados ao Git
git add artifacts/api-server/dist/
git add discloud.config
git add package.json
git commit -m "Build para deploy na Discloud"
git push origin main
```

### 2️⃣ Baixar ZIP do GitHub

**Opção A - Via GitHub.com:**
1. Acesse seu repositório no GitHub
2. Clique no botão verde **"Code"**
3. Clique em **"Download ZIP"**
4. Aguarde o download (será ~10-20 MB sem node_modules)

**Opção B - Via comando:**
```bash
# Substitua pelo seu repositório
wget https://github.com/seu-usuario/anime-rpg-discord/archive/refs/heads/main.zip -O repo.zip
```

### 3️⃣ Extrair e Preparar

1. **Extraia o ZIP** baixado
2. **Entre na pasta extraída** (ex: `anime-rpg-discord-main`)
3. **Verifique** se tem:
   - ✅ `artifacts/api-server/dist/bot/index.mjs`
   - ✅ `discloud.config`
   - ✅ `package.json`
   - ✅ `pnpm-lock.yaml`

### 4️⃣ Criar Novo ZIP (Sem node_modules)

**Windows:**
1. Selecione **TUDO dentro da pasta**
2. Botão direito → **Enviar para** → **Pasta compactada**
3. Renomeie para `bot-discloud.zip`

**Linux/Mac:**
```bash
cd anime-rpg-discord-main
zip -r ../bot-discloud.zip . -x "*.git*" "*.md"
```

**Tamanho esperado:** ~15-30 MB ✅

### 5️⃣ Upload na Discloud

1. Acesse [discloud.app/dashboard](https://discloud.app/dashboard)
2. **Adicionar App** → **Bot**
3. Upload do `bot-discloud.zip`
4. Aguarde upload + instalação de dependências (5-10 min)

### 6️⃣ Configurar Variáveis de Ambiente

No painel da Discloud, adicione:

```env
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
```

### 7️⃣ Iniciar Bot

1. Clique em **Iniciar** ou **Start**
2. Aguarde 2-3 minutos
3. Verifique os **Logs**
4. Bot deve estar online! ✅

---

## 🔧 Como Funciona

### O que a Discloud faz automaticamente:

1. **Recebe o ZIP** (sem node_modules)
2. **Detecta** que é projeto Node.js
3. **Executa** `pnpm install` (instala dependências)
4. **Executa** `npm run prepare` (compila o código se necessário)
5. **Inicia** o bot com o MAIN especificado

### Script `prepare` adicionado:

```json
"prepare": "cd artifacts/api-server && node build.mjs"
```

Este script garante que o código seja compilado mesmo se você esquecer de fazer push do `dist/`.

---

## 📊 Comparação de Tamanhos

| Método | Tamanho | Status |
|--------|---------|--------|
| ZIP local com node_modules | 100-200 MB | ❌ Muito grande |
| ZIP do GitHub (sem node_modules) | 15-30 MB | ✅ Perfeito |
| Deploy direto Git | 0 MB (não precisa ZIP) | ⚠️ Nem sempre disponível |

---

## ✅ Checklist Pré-Deploy

- [ ] Código compilado (`dist/bot/index.mjs` existe)
- [ ] Commit e push para GitHub
- [ ] Download ZIP do GitHub
- [ ] ZIP extraído
- [ ] Novo ZIP criado (sem node_modules)
- [ ] Tamanho do ZIP < 100 MB
- [ ] `discloud.config` com RAM=512
- [ ] `package.json` com script `prepare`
- [ ] Variáveis de ambiente prontas
- [ ] Banco de dados PostgreSQL criado

---

## 🐛 Troubleshooting

### "Erro ao instalar dependências"

**Causa:** pnpm não instalado na Discloud  
**Solução:** A Discloud usa npm por padrão. Remova o script `preinstall` ou use npm:

```json
// Remova ou comente esta linha:
"preinstall": "sh -c 'rm -f package-lock.json yarn.lock...",
```

### "Arquivo principal não encontrado"

**Causa:** `dist/` não foi commitado  
**Solução:** 
```bash
git add -f artifacts/api-server/dist/
git commit -m "Add compiled files"
git push
```

### "Módulo não encontrado"

**Causa:** Dependência não instalada  
**Solução:** Verifique `pnpm-lock.yaml` no ZIP

### "RAM insuficiente"

**Causa:** Build consome muita RAM  
**Solução:** Aumentar RAM para 512 MB ou 1 GB no `discloud.config`

---

## 💡 Dicas de Otimização

### 1. Commit apenas o necessário

Adicione ao `.gitignore`:
```
node_modules/
*.log
.env
*.md
!README.md
```

### 2. Use build cache

O `prepare` script só compila se necessário.

### 3. Monitore RAM

Use 512 MB no free plan ou upgrade para Premium se precisar.

---

## 🔄 Atualizações Futuras

Quando fizer mudanças:

```bash
# 1. Fazer mudanças no código
# 2. Build
cd artifacts/api-server && node build.mjs && cd ../..

# 3. Commit
git add .
git commit -m "Update: descrição da mudança"
git push

# 4. Baixar novo ZIP do GitHub
# 5. Upload na Discloud (substituir)
```

---

## 📝 Estrutura do ZIP Final

```
bot-discloud.zip
├── artifacts/
│   └── api-server/
│       ├── dist/              ✅ Compilado
│       │   └── bot/
│       │       └── index.mjs
│       └── src/               ✅ Código fonte
├── lib/
│   └── db/
│       ├── drizzle/           ✅ Migrations
│       └── scripts/           ✅ Scripts
├── discloud.config            ✅ Config Discloud
├── package.json               ✅ Dependências
└── pnpm-lock.yaml            ✅ Lock file

❌ node_modules/  (NÃO incluir - Discloud instala)
```

**Tamanho:** ~20 MB ✅

---

## 🎯 Resumo

1. ✅ Build local (`node build.mjs`)
2. ✅ Commit + Push para GitHub
3. ✅ Download ZIP do GitHub
4. ✅ Criar novo ZIP (sem node_modules)
5. ✅ Upload na Discloud
6. ✅ Configurar variáveis
7. ✅ Iniciar bot

**Deploy em 10 minutos! 🚀**
