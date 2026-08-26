# 🚀 START HERE - Sistema de Auto-Sincronização

## ❌ Problema que Você Tinha

Toda vez que adicionava ou modificava personagens, precisava:
1. Editar `characters.ts`
2. Rodar `pnpm run seed` manualmente
3. Reiniciar o servidor
4. Esperar tudo carregar

**Chato e lento!** 😩

## ✅ Solução Implementada

Agora é **automático**! 

1. Edita `characters.ts`
2. Salva (Ctrl+S)
3. ✨ **Pronto!** Sistema detecta e sincroniza sozinho

## 🎯 Como Começar (3 Passos)

### 1. Commit e Push (No seu computador)

```bash
git add .
git commit -m "feat: sistema de auto-sincronização do catálogo"
git push
```

### 2. Configurar no Replit

**A. Pull das mudanças:**
```bash
git pull
pnpm install
pnpm --filter @workspace/api-server run build
```

**B. Configurar Modo Memória (Recomendado para testar):**

No Replit:
1. Vá em "Secrets" 🔒 ou "Environment Variables"
2. Encontre `USE_DATABASE`
3. Mude para `false` ou **delete** a variável

**Por quê?**
- ✅ Evita erro de migration
- ✅ Auto-sync é **instantâneo** (sem esperar 5s)
- ✅ Perfeito para testar
- O auto-sync funciona **igual** nos dois modos!

### 3. Iniciar o Bot

```bash
pnpm run bot:api-server
```

**Você deve ver:**
```
[startup-sync] Database sync skipped...
[db] Auto-sync do catálogo ativado (modo desenvolvimento)
Server listening { port: 3000 }
```

✅ **Funcionou!**

## 🧪 Teste Rápido (2 minutos)

### 1. Adicionar Personagem de Teste

Edite `lib/db/src/data/characters.ts` e adicione:

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
    conditionalRules: [],
  },
},
```

### 2. Salvar e Aguardar

- **Modo Memória:** Imediato! 🚀
- **Modo Banco:** ~5 segundos ⏱️

Console mostrará:
```
[MemoryStore] Catálogo atualizado detectado, cache invalidado
```

### 3. Testar no Discord

```
/personagens
```

**Saitama deve aparecer na lista!** 🎉

### 4. Remover Teste

Delete a entrada do Saitama, salve, e pronto! Sincroniza automaticamente.

## 📚 Documentação Completa

Se ficou com dúvida ou quer mais detalhes:

- **`SOLUCAO_MIGRATION_ERROR.md`** ← Se teve erro de migration
- **`COMO_TESTAR.md`** ← Guia de testes completo
- **`EXEMPLO_ADICIONAR_PERSONAGEM.md`** ← Exemplos prontos de personagens
- **`CATALOG_AUTO_SYNC.md`** ← Documentação técnica completa
- **`RESUMO_MUDANCAS.md`** ← Lista de tudo que mudou

## ❓ Dúvidas Comuns

### "Erro de migration ao iniciar"
👉 Leia `SOLUCAO_MIGRATION_ERROR.md`  
**TL;DR:** Use `USE_DATABASE=false`

### "Como adiciono personagens agora?"
👉 Leia `EXEMPLO_ADICIONAR_PERSONAGEM.md`  
**TL;DR:** Edita `characters.ts`, salva, pronto!

### "Preciso rodar comandos manuais?"
👉 **Não!** É automático. Se quiser forçar: `node test-auto-sync.mjs sync`

### "Funciona em modo memória?"
👉 **Sim!** E é até mais rápido (instantâneo vs 5 segundos)

### "E em produção?"
👉 Use `USE_DATABASE=true`. O auto-sync funciona igual.

### "Os comandos Discord mudaram?"
👉 **Não!** Tudo funciona exatamente igual. Só o backend que ficou automático.

## 🎮 Workflow do Dia-a-Dia

### Antes (Ruim) 😩
```
1. Editar characters.ts
2. Terminal: pnpm run seed
3. Reiniciar servidor
4. Aguardar 30-60s
5. Testar
```

### Agora (Bom) 🎉
```
1. Editar characters.ts
2. Salvar (Ctrl+S)
3. ✨ Automático!
4. Testar
```

**Economiza tempo, evita erros, aumenta produtividade!**

## ✅ Checklist Final

- [ ] Fez commit e push das mudanças
- [ ] Pull no Replit
- [ ] Build concluído sem erros
- [ ] Configurou `USE_DATABASE=false` (se teve erro)
- [ ] Bot iniciou com sucesso
- [ ] Viu mensagem "Auto-sync ativado"
- [ ] Adicionou personagem de teste
- [ ] Viu logs de sincronização
- [ ] Testou no Discord `/personagens`
- [ ] Saitama apareceu na lista
- [ ] 🎉 **Sistema funcionando!**

## 🚀 Próximo Passo

**Adicione seus personagens favoritos!**

Veja exemplos prontos em `EXEMPLO_ADICIONAR_PERSONAGEM.md`:
- DPS de alto dano
- Healer de suporte
- Tank defensivo
- E muito mais!

---

**Dúvidas?** Todos os arquivos de documentação estão na raiz do projeto. 📚

**Pronto para começar?** Siga os 3 passos acima! 🎯
