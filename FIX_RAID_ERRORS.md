# 🔧 Correção de Erros do Raid

## Problema

Você está com erros no sistema de Raid porque há **código antigo** rodando no Replit:

```
[EffectRegistry] Erro ao processar passiva kokushibo_lua_crescente: TypeError: Cannot read properties of undefined (reading 'stacks')
    at Object.process (/home/runner/workspace/utils/combat/SwordPassives.js:498:59)
    
Erro durante a raid: ReferenceError: mecanicaAtaque is not defined
    at RaidBattle.resolverTurnosAliados (/home/runner/workspace/utils/RaidBattle.js:3906:68)
```

Esses arquivos (`/utils/combat/SwordPassives.js`, `/utils/RaidBattle.js`) **NÃO EXISTEM** no projeto atual. São arquivos antigos que precisam ser removidos.

---

## ✅ Solução: Limpar e Fazer Deploy do Código Novo

### **Passo 1: No Replit - Limpar Código Antigo**

```bash
# Parar o bot (Stop no Replit)

# Remover código antigo
rm -rf utils commands index.js

# Remover build antigo
rm -rf artifacts/api-server/dist

# Verificar que foi removido
ls -la
```

### **Passo 2: Rebuild Completo**

```bash
# Rebuild do bot com código novo
cd artifacts/api-server && node build.mjs && cd ../..

# Verificar que o build foi criado
ls -la artifacts/api-server/dist/
```

Você deve ver arquivos `.mjs` na pasta `dist/`:
- `bot/index.mjs`
- `bot/handlers.mjs`
- `bot/raid-handlers.mjs`
- etc.

### **Passo 3: Verificar Entrypoint**

O bot deve iniciar via `start-bot.mjs` que aponta para:
```javascript
artifacts/api-server/dist/bot/index.mjs
```

Verifique o arquivo `start-bot.mjs`:
```bash
cat start-bot.mjs
```

Deve conter algo como:
```javascript
import './artifacts/api-server/dist/bot/index.mjs';
```

### **Passo 4: Reiniciar Bot**

No Replit:
1. Click "Stop"
2. Click "Run"
3. Verificar logs - NÃO deve mais aparecer erros de `SwordPassives.js` ou `RaidBattle.js`

---

## 🎯 Sistema de Raid Atual

O **código novo** (TypeScript) usa:

### Arquivos Corretos:
- ✅ `/artifacts/api-server/src/bot/raid-handlers.ts` - Handler do comando `/raid`
- ✅ `/artifacts/api-server/src/services/RaidService.ts` - Lógica do Raid
- ✅ `/artifacts/api-server/src/services/RaidBattleEngine.ts` - Engine de batalha Raid
- ✅ `/artifacts/api-server/src/battle/BattleEngine.ts` - Engine de batalha base

### Funcionalidades Incluídas:
- ✅ Equipamentos funcionando
- ✅ Ultimates com animações
- ✅ Passivas ativas (incluindo MOON_CRESCENT_BLADE do Kokushibo)
- ✅ Sistema de fases do boss
- ✅ Menu de batalha completo igual Arena/PvE
- ✅ Embeds com HP bars, skills, status effects

---

## 🐛 Se Ainda Houver Erros Após Rebuild

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
pnpm install
```

### Erro: "passiva X não encontrada"
```bash
# Re-seed do banco de dados para sincronizar passivas
cd lib/db && pnpm run seed && cd ../..
```

### Erro: "interaction already replied"
- Já corrigido no código - basta rebuild

---

## 📋 Checklist Final

- [ ] Remover `/utils/`, `/commands/`, `index.js` antigos
- [ ] Rebuild completo (`node build.mjs`)
- [ ] Verificar que `dist/` foi criado
- [ ] Reiniciar bot no Replit
- [ ] Testar `/raid iniciar dificuldade:normal`
- [ ] Verificar que battle menu aparece
- [ ] Verificar que equipamentos funcionam
- [ ] Verificar que ultimates aparecem

---

## 🎉 Resultado Esperado

Após seguir esses passos:

1. ✅ Raid funciona com sistema completo
2. ✅ Boss Rush funciona com BattleEngine
3. ✅ Banners aparecem em `/invocar`, `/personagem`, `/perfil`
4. ✅ Equipamentos funcionam em todas as batalhas
5. ✅ Passivas funcionam (incluindo Kokushibo Moon)
6. ✅ Nenhum erro de "mecanicaAtaque" ou "stacks"

---

## 📞 Debug

Se continuar com problemas, verifique os logs:

```bash
# Ver logs em tempo real
tail -f ~/.local/share/pnpm/global/5/node_modules/.pnpm/pm2@*/node_modules/pm2/logs/*

# Ou no console do Replit
# Os logs devem mostrar apenas:
# [INFO] Bot iniciado
# [INFO] Comandos registrados
# Sem erros de SwordPassives.js ou RaidBattle.js
```

Se aparecer qualquer referência a arquivos `.js` antigos, significa que o código antigo ainda está sendo executado e precisa ser removido manualmente.
