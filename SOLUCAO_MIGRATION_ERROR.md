# 🔧 Solução: Erro de Migration

## O Problema

```
Failed query: CREATE TYPE "public"."banner_type" AS ENUM(...)
```

Isso acontece porque o banco de dados já tem os tipos ENUM criados, mas a migration tenta criá-los novamente.

## ✅ Solução Rápida: Modo Memória (Recomendado para Desenvolvimento)

O sistema de auto-sincronização funciona **perfeitamente em modo memória**! Você não precisa de banco de dados para testar.

### No Replit, configure as variáveis de ambiente:

1. Clique em "Secrets" (🔒) ou "Environment Variables"

2. **Remova ou altere:**
   ```
   USE_DATABASE=true
   ```
   
   Para:
   ```
   USE_DATABASE=false
   ```
   
   Ou simplesmente **delete** a variável `USE_DATABASE`

3. Reinicie o bot:
   ```bash
   pnpm run bot:api-server
   ```

### Vantagens do Modo Memória:

✅ **Sem configuração de banco**  
✅ **Mais rápido** para testar  
✅ **Auto-sync funciona instantaneamente** (sem os 5s de espera)  
✅ **Zero problemas de migration**  
✅ **Perfeito para desenvolvimento**  

### Como funciona:

```
Modo Memória → Cache invalidado instantaneamente
Modo Banco   → Sincroniza a cada 5 segundos
```

Ambos detectam mudanças automaticamente, mas o modo memória é mais rápido!

## 🔄 Solução Alternativa: Resetar Migrations (Modo Banco)

Se você **realmente precisa** usar o banco de dados:

### Opção 1: Limpar e Recriar (Mais Seguro)

```bash
# No terminal do Replit
cd lib/db
node scripts/reset-migrations.mjs
pnpm run migrate
```

### Opção 2: Conectar e Limpar Manualmente

```sql
-- Conecte no banco PostgreSQL e execute:
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Depois rode:
pnpm --filter @workspace/db run migrate
```

### Opção 3: Pular Migrations

Se o schema já está correto:

```bash
# Marque as migrations como aplicadas sem executá-las
# (Adicione este script no package.json depois)
```

## 🎯 Recomendação

Para **testar o sistema de auto-sincronização**, use **Modo Memória**:

```bash
# 1. No Replit Secrets
USE_DATABASE=false  # ou delete a variável

# 2. Reinicie
pnpm run bot:api-server

# 3. Você verá:
# [startup-sync] Database sync skipped: USE_DATABASE=true and DATABASE_URL are required.
# [db] Auto-sync do catálogo ativado (modo desenvolvimento)
# Server listening { port: 3000 }

# ✨ Pronto! Agora pode testar adicionar personagens
```

## 📝 Testando Auto-Sync em Modo Memória

```typescript
// 1. Edite lib/db/src/data/characters.ts
{
  anime: "One Punch Man",
  name: "Saitama",
  rarity: "mythic",
  role: "dps",
  baseHp: 9999,
  baseAttack: 999,
  // ... resto
}

// 2. Salve (Ctrl+S)

// 3. Veja no console IMEDIATAMENTE:
// [MemoryStore] Catálogo atualizado detectado, cache invalidado

// 4. Teste no Discord:
// /personagens
// ✨ Saitama aparece na lista!
```

## 🎮 Quando Usar Cada Modo

### Modo Memória (USE_DATABASE=false)
✅ Desenvolvimento local  
✅ Testar mudanças rápidas  
✅ Testar auto-sync  
✅ Testar novos personagens  
❌ Dados perdidos ao reiniciar  

### Modo Banco (USE_DATABASE=true)
✅ Produção  
✅ Dados persistentes  
✅ Múltiplos jogadores  
✅ Histórico de batalhas  
❌ Precisa configurar PostgreSQL  

## 🚀 Próximos Passos

```bash
# 1. Configure modo memória
USE_DATABASE=false

# 2. Reinicie o bot
pnpm run bot:api-server

# 3. Adicione um personagem em characters.ts

# 4. Salve e teste no Discord
/personagens

# 5. ✨ Funciona!
```

---

**Dica:** O auto-sync funciona em **ambos os modos**! Escolha o que for mais conveniente para você. 🎯
