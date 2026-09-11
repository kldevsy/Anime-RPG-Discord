# ✅ Solução: ZIP > 100 MB na Discloud

## 🎯 O Problema

```
❌ ZIP local com node_modules = 100-200 MB
❌ Discloud Free limit = 100 MB
❌ Não da para fazer upload!
```

## 💡 A Solução

**Use o ZIP do GitHub (sem node_modules)!**

A Discloud **instala as dependências automaticamente** quando você faz upload.

---

## 🚀 Passo a Passo Rápido

### 1. Fazer Push para GitHub

```bash
# Build
cd ~/workspace/artifacts/api-server
node build.mjs
cd ../..

# Commit
git add artifacts/api-server/dist/
git add discloud.config package.json
git commit -m "Deploy build"
git push origin main
```

### 2. Baixar ZIP do GitHub

1. Ir no seu repositório GitHub
2. Botão verde **"Code"**
3. **"Download ZIP"**
4. Aguardar download (~15-20 MB)

### 3. Preparar ZIP

1. **Extrair** o ZIP baixado
2. **Entrar** na pasta extraída
3. **Selecionar tudo** (Ctrl + A)
4. **Criar novo ZIP** (botão direito → comprimir)

**Resultado:** ZIP de ~20 MB ✅

### 4. Upload na Discloud

1. Upload do novo ZIP
2. Aguardar instalação de dependências (5-10 min)
3. Configurar variáveis de ambiente
4. Iniciar bot

---

## 📊 Comparação

| Método | Tamanho | Funciona? |
|--------|---------|-----------|
| ZIP local + node_modules | 150 MB | ❌ Muito grande |
| ZIP GitHub (sem node_modules) | 20 MB | ✅ Perfeito! |

---

## ⚠️ Importante

### O que DEVE estar no ZIP:

- ✅ `artifacts/api-server/dist/` (código compilado)
- ✅ `artifacts/api-server/src/` (código fonte)
- ✅ `lib/db/drizzle/` (migrations)
- ✅ `discloud.config`
- ✅ `package.json`
- ✅ `pnpm-lock.yaml`

### O que NÃO deve estar:

- ❌ `node_modules/` (Discloud instala)
- ❌ `.git/`
- ❌ `.env`
- ❌ `*.md` (documentação)

---

## 🔧 Configurações Atualizadas

### `discloud.config`
```ini
RAM=512  # Aumentado para 512 MB (build precisa)
```

### `package.json`
```json
"prepare": "cd artifacts/api-server && node build.mjs"
```

Este script garante compilação automática na Discloud.

---

## 🐛 Se Der Erro

### "Arquivo principal não encontrado"

**Causa:** Não fez push do `dist/`  
**Solução:**
```bash
git add -f artifacts/api-server/dist/
git commit -m "Add build"
git push
```

### "Erro ao instalar dependências"

**Causa:** Script `preinstall` bloqueia npm  
**Solução:** Comente a linha no `package.json`:
```json
// "preinstall": "...",
```

### "RAM insuficiente"

**Causa:** Build precisa de mais RAM  
**Solução:** Use RAM=512 ou RAM=1024

---

## ✅ Checklist Final

- [ ] Build compilado localmente
- [ ] Push para GitHub
- [ ] Download ZIP do GitHub
- [ ] Novo ZIP criado (sem node_modules)
- [ ] ZIP < 100 MB (deve ser ~20 MB)
- [ ] Upload na Discloud
- [ ] Variáveis de ambiente configuradas
- [ ] Bot iniciado

---

## 🎉 Resultado

✅ **ZIP de 20 MB** → Upload rápido  
✅ **Discloud instala deps** → Sem limite de 100 MB  
✅ **Bot online** em 10 minutos! 🚀

---

**Guia completo:** `DEPLOY_GITHUB_DISCLOUD.md`
