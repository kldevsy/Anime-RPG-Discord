# 🔄 Sistema de Sincronização Automática do Catálogo

## O que mudou?

Antes você precisava **rodar um comando** toda vez que modificava personagens. Agora é **automático**! 🎉

## Como usar

### ✨ Para adicionar/modificar personagens:

1. Abra `lib/db/src/data/characters.ts`
2. Adicione ou modifique personagens no array `characterCatalog`
3. Salve o arquivo
4. **Pronto!** O sistema detecta e sincroniza automaticamente

### Exemplo - Adicionar novo personagem:

```typescript
// Em lib/db/src/data/characters.ts
export const characterCatalog: CharacterCatalogEntry[] =
  characterCatalogSchema.parse([
    // ... personagens existentes ...
    {
      anime: "Attack on Titan",
      name: "Eren Yeager",
      rarity: "legendary",
      role: "dps",
      baseHp: 1200,
      baseAttack: 250,
      baseDefense: 120,
      baseSpeed: 115,
      imageUrl: "https://exemplo.com/eren.png",
      passive: "Titã de Ataque: aumenta dano quando HP baixo",
      ultimate: {
        id: "eren_titan_transformation",
        name: "Transformação Titã",
        description: "Transforma-se em Titã de Ataque",
        chargeRequired: 120,
        chargeOnBasic: 15,
        chargeOnDamageTaken: 12,
        chargeOnCritical: 6,
        type: "BUFF",
        targetType: "self",
        multiplier: 0,
        statusEffects: [
          { type: "attack_up", chance: 100, duration: 3, value: 50 },
          { type: "defense_up", chance: 100, duration: 3, value: 30 },
        ],
        conditionalRules: [],
      },
    },
  ]);
```

Salve o arquivo e aguarde ~5 segundos. Você verá no console:

```
[db] Mudança detectada no catálogo, sincronizando...
[db] Catálogo sincronizado automaticamente { count: 10 }
```

### 📝 Para modificar imagens ou stats:

```typescript
{
  anime: "Naruto",
  name: "Naruto Uzumaki",
  // Mude a imagem
  imageUrl: "https://nova-url-da-imagem.png",
  // Ou ajuste stats
  baseAttack: 200, // era 180
  // ...
}
```

Salve e está feito! 

### ⚡ Sincronização imediata (opcional):

Se não quiser esperar os ~5 segundos:

```bash
curl -X POST http://localhost:3000/admin/sync-catalog
```

Ou use uma ferramenta como Postman/Insomnia para fazer POST em:
```
POST http://localhost:3000/admin/sync-catalog
```

### 🔍 Verificar status:

```bash
curl http://localhost:3000/admin/catalog-status
```

## Como funciona?

### 1️⃣ **Detecção automática**
- Sistema calcula um "hash" (impressão digital) do catálogo
- Compara com o hash anterior
- Se mudou → sincroniza automaticamente

### 2️⃣ **Modo Memória (sem banco)**
- Cache é invalidado instantaneamente ao detectar mudanças
- Próxima requisição já usa dados novos
- Não precisa reiniciar o servidor

### 3️⃣ **Modo Banco de Dados**
- Watcher verifica mudanças a cada 5 segundos
- Sincroniza automaticamente quando detecta mudanças
- Preserva personagens criados via comando admin

### 4️⃣ **Cache Inteligente**
- Sistema invalida cache automaticamente
- Evita verificações excessivas
- Balanceia performance e atualização

## Quando usar cada modo?

### Modo Automático (Padrão) ✅
- **Desenvolvimento**: perfeito para testar rapidamente
- **Mudanças frequentes**: não precisa lembrar de sincronizar
- **Múltiplos desenvolvedores**: cada um vê mudanças automaticamente

### Sincronização Manual ⚡
- **Deploy em produção**: garante dados sincronizados
- **Após mudanças grandes**: confirma imediatamente
- **Debugging**: força atualização para testar

## Logs úteis

```bash
# Mudança detectada e sincronizada
[db] Mudança detectada no catálogo, sincronizando...
[db] Catálogo sincronizado automaticamente { count: 10, hash: "abc123..." }

# Cache invalidado (modo memória)
[MemoryStore] Catálogo atualizado detectado, cache invalidado

# Cache invalidado (modo banco)
[CatalogCache] Mudança no catálogo detectada, invalidando cache

# Nenhuma mudança
[db] Character catalog sync skipped { reason: "no-changes" }
```

## Configuração

### Desativar watcher automático

No arquivo `artifacts/api-server/src/index.ts`:

```typescript
// Comente ou remova estas linhas:
// if (isDevelopment) {
//   startCatalogWatcher(5000);
//   logger.info("Auto-sync do catálogo ativado");
// }
```

### Ajustar intervalo de verificação

```typescript
// Verifica a cada 10 segundos ao invés de 5
startCatalogWatcher(10000);
```

### Modo produção

O watcher é **desativado automaticamente** quando `NODE_ENV=production`.
A sincronização no startup continua funcionando normalmente.

## Troubleshooting

### Mudanças não aparecem

1. Verifique os logs - deve aparecer "Mudança detectada"
2. Se não aparecer, tente sincronização manual
3. Verifique se salvou o arquivo corretamente
4. Em modo desenvolvimento, aguarde até 5 segundos

### Erro de validação

```
Error: anime + name must be unique
```

Significa que você tentou adicionar um personagem com anime+nome duplicado. Cada combinação deve ser única.

### Erro de schema

```
Expected object, received string
```

Verifique se todos os campos obrigatórios estão preenchidos corretamente. Use o exemplo acima como referência.

## FAQ

**P: Preciso reiniciar o servidor ao adicionar personagens?**
R: Não! O sistema detecta automaticamente.

**P: E se eu quiser ter certeza que sincronizou?**
R: Use `POST /admin/sync-catalog` ou verifique os logs.

**P: Funciona em produção?**
R: O watcher é desativado em produção, mas a sync no startup funciona.

**P: E personagens criados via comando admin?**
R: São preservados! Apenas personagens com `catalogManaged=true` são sincronizados.

**P: Posso usar com o seed antigo?**
R: Sim! O comando `pnpm --filter @workspace/db run seed` continua funcionando.

**P: Como sei se há mudanças pendentes?**
R: Use `GET /admin/catalog-status`

## Benefícios

✅ **Produtividade**: Edita e testa imediatamente  
✅ **Menos erros**: Não esquece de sincronizar  
✅ **Desenvolvimento fluido**: Sem interrupções  
✅ **Logs claros**: Sabe quando sincroniza  
✅ **Flexível**: Pode forçar sync se precisar  
✅ **Seguro**: Preserva dados admin  

---

**Dúvidas?** Verifique `.agents/memory/auto-catalog-sync.md` para detalhes técnicos.
