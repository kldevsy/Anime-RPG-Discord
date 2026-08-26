# 🧪 Como Testar o Sistema de Auto-Sincronização

## ⚠️ Importante

Você está editando localmente mas o projeto roda no **Replit**. Para testar, você precisa:

1. **Fazer commit e push** das mudanças
2. **Executar no Replit**

## Passo a Passo para Testar

### 1. Commit das Mudanças

No seu terminal local (Git Bash ou PowerShell com Git):

```bash
# Adiciona todos os arquivos novos/modificados
git add .

# Faz commit
git commit -m "feat: adiciona sistema de auto-sincronização do catálogo

- Detecta mudanças automaticamente via hash SHA-256
- Invalida cache automaticamente em MemoryStore e CatalogCache
- Adiciona watcher para modo desenvolvimento
- Cria endpoints admin para sync manual
- Documenta sistema completo"

# Envia para o repositório
git push
```

### 2. No Replit

#### Opção A: Pull Automático
Se o Replit está configurado para auto-pull, ele vai atualizar automaticamente.

#### Opção B: Pull Manual
No terminal do Replit:
```bash
git pull
pnpm install
pnpm --filter @workspace/api-server run build
```

### 2.5 ⚠️ Configurar Modo Memória (Recomendado)

**Se você receber erro de migration**, use **Modo Memória** (mais rápido e fácil):

1. No Replit, vá em "Secrets" (🔒) ou "Environment Variables"
2. Configure: `USE_DATABASE=false` (ou delete a variável `USE_DATABASE`)
3. Isso **não afeta** o auto-sync! Funciona perfeitamente em modo memória.

**Vantagens:**
- ✅ Sem problemas de migration
- ✅ Auto-sync **instantâneo** (sem esperar 5s)
- ✅ Mais rápido para testar
- ❌ Dados perdidos ao reiniciar (ok para desenvolvimento)

Veja `SOLUCAO_MIGRATION_ERROR.md` para mais detalhes.

### 3. Inicie o Servidor no Replit

Clique no botão **Run** ou no terminal do Replit:
```bash
pnpn bot:api-server
```

### 4. Verifique os Logs

Você deve ver algo como:
```
[db] Character catalog synchronized { count: 9, hash: "abc123..." }
[db] Auto-sync do catálogo ativado (modo desenvolvimento)
Server listening { port: 3000 }
```

## 🧪 Testm ruando as Funcionalidades

### Teste 1: Adicionar um Personagem

#### No Editor (Local ou Replit)

1. Abra `lib/db/src/data/characters.ts`

2. Adicione este personagem de teste:

```typescript
{
  anime: "One Punch Man",
  name: "Saitama",
  rarity: "mythic",
  role: "dps",
  baseHp: 9999,
  baseAttack: 999,
  baseDefense: 999,
  baseSpeed: 150,
  imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
  passive: "One Punch: mata qualquer inimigo em um soco",
  ultimate: {
    id: "saitama_serious_punch",
    name: "Serious Punch",
    description: "Um soco sério que destrói tudo",
    chargeRequired: 200,
    chargeOnBasic: 10,
    chargeOnDamageTaken: 5,
    chargeOnCritical: 15,
    type: "EXECUTE",
    targetType: "single_enemy",
    multiplier: 99.9,
    statusEffects: [],
    conditionalRules: [
      {
        condition: "Sempre",
        effect: "one-shot kill"
      }
    ],
  },
},
```

3. Salve o arquivo

4. **Se editando localmente**: Commit e push
   ```bash
   git add lib/db/src/data/characters.ts
   git commit -m "test: adiciona Saitama para testar auto-sync"
   git push
   ```

5. **No Replit**: Aguarde ~5 segundos

6. **Veja os logs** no console do Replit:
   ```
   [db] Mudança detectada no catálogo, sincronizando...
   [db] Catálogo sincronizado automaticamente { count: 10, hash: "def456..." }
   [MemoryStore] Catálogo atualizado detectado, cache invalidado
   [CatalogCache] Mudança no catálogo detectada, invalidando cache
   ```

7. **Teste no Discord**:
   ```
   /personagens
   ```
   O Saitama deve aparecer na lista! 🎉

### Teste 2: Modificar uma Imagem

1. No mesmo arquivo, mude a imagem do Naruto:
   ```typescript
   imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png",
   ```

2. Salve, commit (se local), push

3. Aguarde ~5 segundos

4. Veja os logs confirmando sincronização

5. Teste no Discord:
   ```
   /personagem nome:Naruto Uzumaki
   ```
   A nova imagem deve aparecer!

### Teste 3: Sincronização Manual

No terminal do Replit:

```bash
node test-auto-sync.mjs status
```

Você verá:
```
🔍 Verificando status do catálogo...

✅ Status: Catálogo está sincronizado
   Mudanças pendentes: Não
```

Agora force uma sincronização:

```bash
node test-auto-sync.mjs sync
```

Você verá:
```
⚡ Forçando sincronização do catálogo...

✅ Catálogo sincronizado com sucesso

📊 Detalhes:
   Personagens atualizados: 10
   Motivo: forced
   Hash: abc123def456...
```

### Teste 4: Via API (usando curl no Replit)

```bash
# Verificar status
curl http://localhost:3000/admin/catalog-status

# Forçar sync
curl -X POST http://localhost:3000/admin/sync-catalog
```

## 📝 Checklist de Teste

- [ ] Servidor inicia sem erros
- [ ] Vê mensagem "Auto-sync do catálogo ativado"
- [ ] Adiciona personagem novo
- [ ] Logs mostram "Mudança detectada"
- [ ] Logs mostram "Catálogo sincronizado automaticamente"
- [ ] Personagem aparece no Discord `/personagens`
- [ ] Modifica imagem de personagem existente
- [ ] Mudança reflete no Discord
- [ ] Script `test-auto-sync.mjs status` funciona
- [ ] Script `test-auto-sync.mjs sync` funciona
- [ ] Endpoints `/admin/catalog-status` funcionam
- [ ] Endpoints `/admin/sync-catalog` funcionam

## 🐛 Troubleshooting

### "Não vejo os logs de sincronização"

**Motivo:** O watcher só ativa em modo desenvolvimento

**Solução:** Verifique se `NODE_ENV !== "production"` no Replit

### "Mudanças não aparecem no Discord"

1. Verifique se o servidor está rodando
2. Verifique os logs - deve mostrar "sincronizado"
3. Force sync manual: `node test-auto-sync.mjs sync`
4. Teste com `/personagens` para ver lista completa

### "Erro ao adicionar personagem"

Comum: `anime + name must be unique`

**Solução:** Verifique se já existe um personagem com o mesmo anime e nome

### "pnpm não encontrado" (no Windows local)

**Isso é normal!** O projeto roda no Replit, não localmente.

**Solução:** Faça commit/push e rode no Replit

## 🎯 Próximos Testes

Depois de confirmar que funciona:

1. Adicione vários personagens de uma vez
2. Modifique stats de personagens existentes
3. Teste o balanceamento em batalhas
4. Adicione personagens de novos animes

## 📚 Arquivos de Referência

- `CATALOG_AUTO_SYNC.md` - Documentação completa
- `EXEMPLO_ADICIONAR_PERSONAGEM.md` - Guia prático com exemplos
- `.agents/memory/auto-catalog-sync.md` - Detalhes técnicos

## 💡 Dica Final

Depois que testar e confirmar que funciona:

**Remova o personagem de teste Saitama** (ele é muito OP! 😅)

```bash
# No editor, delete a entrada do Saitama
# Commit e push
git add lib/db/src/data/characters.ts
git commit -m "remove: personagem de teste Saitama"
git push

# No Replit, aguarde ~5s e ele será removido automaticamente!
```

---

**Pronto para testar?** Siga os passos acima e divirta-se! 🚀
