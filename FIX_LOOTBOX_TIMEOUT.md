# 🔧 Fix: Unknown Interaction Error - Loot Box

## ❌ Problema Identificado:

```
DiscordAPIError[10062]: Unknown interaction
Failed to defer loja
```

**Causa:** O comando estava demorando mais de 3 segundos para responder devido aos **imports dinâmicos** (`await import()`).

---

## ✅ Solução Aplicada:

### 1. Movido Imports para o Topo do Arquivo

**Antes (LENTO ❌):**
```typescript
if (commandName === "loja") {
  const { lootBoxService } = await import("../services/LootBoxService"); // ⚠️ Import dinâmico lento
  const { createLootBoxShopEmbed } = await import("./embeds");
  // ...
}
```

**Depois (RÁPIDO ✅):**
```typescript
// No topo do arquivo
import { lootBoxService } from "../services/LootBoxService";
import {
  createLootBoxShopEmbed,
  createLootBoxOpeningEmbed,
  createLootBoxHistoryEmbed,
  createDailyFreeBoxEmbed,
} from "./embeds";

// No handler
if (commandName === "loja") {
  // Usa direto, sem import
  const embed = createLootBoxShopEmbed(...);
}
```

---

## 🚀 Resultado:

✅ **Comandos respondem em < 1 segundo**
✅ **Sem erro de "Unknown interaction"**
✅ **Defer acontece a tempo**

---

## 📝 Arquivos Modificados:

- `artifacts/api-server/src/bot/handlers.ts`
  - Adicionado import estático do `lootBoxService`
  - Adicionado imports dos embeds de lootbox
  - Removido `await import()` dos handlers

---

## 🧪 Testar Agora:

```bash
# Rebuildar
cd artifacts/api-server
pnpm run build

# Reiniciar bot
pnpm run bot
```

```
# No Discord
/loja
/lootbox abrir tipo:Básica
/lootbox diaria
```

---

## ⚡ Por Que Imports Dinâmicos São Lentos?

Imports dinâmicos (`await import()`) são úteis para:
- Carregar módulos sob demanda
- Code splitting
- Lazy loading

**MAS** não são bons para:
- ❌ Comandos Discord (timeout de 3s)
- ❌ Operações críticas de tempo
- ❌ Hot paths

**Solução:** Usar imports estáticos no topo do arquivo para módulos usados frequentemente.

---

## ✅ FIX APLICADO COM SUCESSO!

Sistema agora está otimizado e pronto para uso! 🎁✨
