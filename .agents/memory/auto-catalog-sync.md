---
name: Sistema de sincronização automática do catálogo
description: Detecção automática de mudanças no catálogo de personagens, eliminando necessidade de sincronização manual
---

## Problema Original

O sistema anterior exigia execução manual do seed sempre que:
- Adicionava novos personagens em `characters.ts`
- Modificava atributos, imagens ou outras propriedades
- Atualizava ultimates ou passivas

Isso causava fricção no desenvolvimento e risco de dados desatualizados.

## Solução Implementada

### 1. Detecção Automática via Hash (catalog-sync.ts)

- Calcula hash SHA-256 do catálogo inteiro
- Compara hash atual com último conhecido
- Detecta qualquer mudança em personagens, stats, imagens, etc.
- Funciona tanto no banco de dados quanto no modo memória

### 2. Sincronização Inteligente

**Para banco de dados:**
- `syncCharacterCatalog()` agora retorna informações detalhadas:
  - `skipped`: se foi pulado
  - `reason`: motivo (no-database, no-changes, changed, forced)
  - `hash`: hash atual do catálogo
  - `insertedOrUpdated`: quantidade sincronizada

**Para modo memória:**
- `MemoryStore.getMemoryCharacters()` invalida cache automaticamente
- Detecta mudanças via hash antes de retornar dados
- Não precisa reiniciar para ver novos personagens

### 3. Catalog Watcher (catalog-watcher.ts)

Monitoramento contínuo opcional para banco de dados:
- Ativado automaticamente em modo desenvolvimento
- Verifica mudanças a cada 5 segundos
- Sincroniza automaticamente quando detecta mudanças
- Pode ser parado/iniciado programaticamente

```typescript
import { startCatalogWatcher, stopCatalogWatcher } from "@workspace/db";

// Inicia monitoramento
startCatalogWatcher(5000); // verifica a cada 5s

// Para monitoramento
stopCatalogWatcher();
```

### 4. Cache Inteligente (CatalogCache.ts)

- Verifica mudanças automaticamente antes de usar cache
- Invalida cache quando detecta catálogo atualizado
- Evita verificações muito frequentes (máximo a cada 5s)
- Funciona de forma transparente

### 5. Endpoints Admin

**POST /admin/sync-catalog**
- Força sincronização manual imediata
- Invalida todos os caches
- Retorna status detalhado

**GET /admin/catalog-status**
- Verifica se há mudanças pendentes
- Útil para monitoramento

## Como Usar

### Desenvolvimento Normal

1. Edite `lib/db/src/data/characters.ts`
2. Salve o arquivo
3. **Nada mais!** O sistema detecta automaticamente:
   - Em ~5 segundos no modo banco de dados (via watcher)
   - Imediatamente no modo memória (na próxima requisição)

### Sincronização Manual (Opcional)

Se quiser forçar sincronização imediata:

```bash
curl -X POST http://localhost:3000/admin/sync-catalog
```

### Verificar Status

```bash
curl http://localhost:3000/admin/catalog-status
```

## Exemplo de Fluxo

```typescript
// 1. Adiciona personagem em characters.ts
{
  anime: "Attack on Titan",
  name: "Eren Yeager",
  rarity: "legendary",
  // ... outros campos
}

// 2. Salva o arquivo

// 3. Sistema detecta automaticamente:
// [MemoryStore] Catálogo atualizado detectado, cache invalidado
// [CatalogCache] Mudança no catálogo detectada, invalidando cache
// [db] Mudança detectada no catálogo, sincronizando...
// [db] Catálogo sincronizado automaticamente { count: 10, hash: "abc123..." }

// 4. Novos personagens disponíveis imediatamente!
```

## Configuração

### Desativar Watcher

Se não quiser monitoramento automático:

```typescript
// No index.ts, remova ou comente:
startCatalogWatcher(5000);
```

### Ajustar Intervalo

```typescript
// Verifica a cada 10 segundos ao invés de 5
startCatalogWatcher(10000);
```

### Modo Produção

O watcher é desativado automaticamente em produção (`NODE_ENV=production`).
A sincronização inicial no startup continua funcionando.

## Vantagens

1. ✅ **Zero fricção**: Edita e funciona
2. ✅ **Sem comandos manuais**: Não precisa rodar seed
3. ✅ **Sem reiniciar**: Mudanças refletem automaticamente
4. ✅ **Seguro**: Preserva personagens admin (`catalogManaged=false`)
5. ✅ **Performático**: Cache inteligente evita verificações excessivas
6. ✅ **Transparente**: Logs claros de quando sincroniza
7. ✅ **Flexível**: Pode forçar sync manual se necessário

## Backward Compatibility

- Código existente continua funcionando
- `syncCharacterCatalog()` aceita parâmetros antigos
- `getMemoryCharacters()` mantém mesma assinatura
- Seed manual via `pnpm --filter @workspace/db run seed` ainda funciona
