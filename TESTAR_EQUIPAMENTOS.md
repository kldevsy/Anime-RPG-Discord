# 🧪 Como Testar o Sistema de Equipamentos

## 📋 Passo a Passo:

### 1. Gerar Migration ✅ (FAZER AGORA)
```bash
cd lib/db
pnpm drizzle-kit generate
```

**O que isso faz:**
- Gera arquivo de migration SQL em `lib/db/migrations/`
- Cria as tabelas: `equipment`, `user_equipment`, `character_equipped`
- Cria enum `equipable_type`

### 2. Aplicar Migration ✅
```bash
pnpm run migrate
```

**O que isso faz:**
- Aplica a migration no banco de dados
- Cria as tabelas necessárias

### 3. Seed de Equipamentos ✅
```bash
pnpm run seed:equipment
```

**O que isso faz:**
- Popula tabela `equipment` com 10 equipamentos do catálogo
- Exibe log de quantos foram inseridos

**Saída esperada:**
```
🗡️ [EQUIPMENT SYNC] Starting equipment catalog synchronization...

  ✅ Inserted: Bandana do Zoro [epic] - Roronoa Zoro
  ✅ Inserted: Venda dos Seis Olhos [mythic] - Satoru Gojo
  ✅ Inserted: Colar de Tsunade [legendary] - Naruto Uzumaki
  ✅ Inserted: Katana Afiada [epic] - DPS
  ✅ Inserted: Adaga Rápida [rare] - DPS
  ✅ Inserted: Escudo Indestrutível [legendary] - TANK
  ✅ Inserted: Armadura Pesada [epic] - TANK
  ✅ Inserted: Anel do Destino [mythic] - Universal
  ✅ Inserted: Colar de Energia [epic] - Universal
  ✅ Inserted: Brincos de Prata [rare] - Universal

📊 [EQUIPMENT SYNC] Summary:
  ✅ Inserted: 10
  🔄 Updated: 0
  ⏭️  Unchanged: 0
  📦 Total in catalog: 10

✅ [EQUIPMENT SYNC] Equipment catalog synchronized successfully!
```

### 4. Dar Equipamento para Teste 🎁
```sql
-- Dar "Bandana do Zoro" para você
INSERT INTO user_equipment (user_id, equipment_id)
SELECT u.id, e.id
FROM users u
CROSS JOIN equipment e
WHERE u.discord_id = 'SEU_DISCORD_ID_AQUI'
AND e.name = 'Bandana do Zoro';

-- Dar mais equipamentos
INSERT INTO user_equipment (user_id, equipment_id)
SELECT u.id, e.id
FROM users u
CROSS JOIN equipment e
WHERE u.discord_id = 'SEU_DISCORD_ID_AQUI'
AND e.name IN ('Colar de Energia', 'Brincos de Prata', 'Adaga Rápida');
```

**Ou via comando SQL direto:**
```bash
# No terminal do Replit ou onde seu DB está
psql $DATABASE_URL

# Dentro do psql:
INSERT INTO user_equipment (user_id, equipment_id)
SELECT u.id, e.id
FROM users u
CROSS JOIN equipment e
WHERE u.discord_id = 'SEU_DISCORD_ID'
AND e.name IN ('Bandana do Zoro', 'Colar de Energia', 'Brincos de Prata');

\q
```

### 5. Rodar o Bot 🤖
```bash
cd ~/workspace
pnpm --filter @workspace/api-server run bot
```

**O que vai acontecer:**
- Startup sync vai rodar automaticamente
- Migration vai ser aplicada (se ainda não foi)
- Seed de personagens vai rodar
- **Seed de equipamentos vai rodar automaticamente** ✅
- Bot vai iniciar

### 6. Testar Comandos no Discord 🎮

#### A. Ver Inventário:
```
/equipamento inventario
```
**Resultado esperado:**
- Mostra equipamentos que você tem
- Agrupados por raridade
- Com bonus de stats

#### B. Ver Catálogo:
```
/equipamento catalogo
```
**Resultado esperado:**
- Mostra todos os 10 equipamentos
- Com filtros disponíveis

#### C. Ver Info de Equipamento:
```
/equipamento info nome:Bandana do Zoro
```
**Resultado esperado:**
- Detalhes completos
- Stats, passiva, equipável

#### D. Equipar Item:
```
/equipamento equipar personagem:Zoro equipamento:"Bandana do Zoro"
```
**Resultado esperado:**
```
✅ Equipamento Equipado!
Bandana do Zoro foi equipado em Roronoa Zoro!

⚡ Bonus de Stats
+80 ATK, +30 SPD, +10% CRIT

🔮 Passiva Adicionada
Maestria das Três Espadas
Ataques básicos têm 30% de chance de atacar 3 vezes seguidas
```

#### E. Ver Personagem com Equipamento:
```
/personagem nome:Zoro
```
**Resultado esperado:**
- Stats base do Zoro
- Maestria (se tiver)
- **⚔️ Equipamento: Bandana do Zoro** ✅
- Bonus de stats visíveis

#### F. Testar em Batalha:
```
/batalha
```
**Logs esperados:**
```
[EQUIPMENT] Applying equipment to Roronoa Zoro
  equipment: Bandana do Zoro
  bonuses: { hp: 0, attack: 80, speed: 30, critChance: 10 }
[EQUIPMENT] Adding equipment passive to Roronoa Zoro
[BATTLE] Equipment applied to player team
```

**Resultado esperado:**
- Stats de Zoro aumentados (+80 ATK, +30 SPD, +10% CRIT)
- Segunda passiva ativa na batalha
- Mais chance de crítico

#### G. Testar em Arena:
```
/arena dificuldade:Normal
```
**Resultado esperado:**
- Mesmo comportamento que `/batalha`
- Equipamentos aplicados
- Stats com bonus

#### H. Remover Equipamento:
```
/equipamento remover personagem:Zoro
```
**Resultado esperado:**
```
🔓 Equipamento Removido
Bandana do Zoro foi removido de Roronoa Zoro.
```

---

## ✅ Checklist de Teste:

- [ ] Migration gerada
- [ ] Migration aplicada
- [ ] Seed de equipamentos rodado
- [ ] Equipamentos dados ao usuário de teste
- [ ] `/equipamento inventario` funcionando
- [ ] `/equipamento catalogo` funcionando
- [ ] `/equipamento info` funcionando
- [ ] `/equipamento equipar` funcionando
- [ ] `/equipamento remover` funcionando
- [ ] `/personagem` mostrando equipamento
- [ ] `/batalha` aplicando equipamentos
- [ ] `/arena` aplicando equipamentos
- [ ] Stats com bonus corretos
- [ ] Segunda passiva ativa
- [ ] Autocomplete funcionando

---

## 🐛 Troubleshooting:

### Erro: "Cannot find package 'postgres'"
**Solução:** O seed-equipment.mjs foi reescrito para usar `pg` ao invés de `postgres`.

### Erro: "Table equipment does not exist"
**Solução:** Rodar a migration primeiro:
```bash
cd lib/db
pnpm drizzle-kit generate
pnpm run migrate
```

### Erro: "Personagem não encontrado"
**Solução:** Certifique-se de que você tem o personagem na coleção primeiro:
```
/personagens
/invocar
```

### Erro: "Equipamento não encontrado"
**Solução:** Dar equipamento via SQL (passo 4)

### Autocomplete não aparece
**Solução:** Discord demora ~1 hora para sincronizar comandos. Use `/` e espere.

---

## 📊 Queries Úteis:

### Ver todos os equipamentos do catálogo:
```sql
SELECT name, rarity, equipable_type, equipable_target 
FROM equipment 
ORDER BY rarity, name;
```

### Ver equipamentos do usuário:
```sql
SELECT u.discord_id, e.name, e.rarity
FROM user_equipment ue
JOIN users u ON ue.user_id = u.id
JOIN equipment e ON ue.equipment_id = e.id
WHERE u.discord_id = 'SEU_DISCORD_ID';
```

### Ver equipamentos equipados:
```sql
SELECT 
  u.discord_id,
  c.name as character_name,
  e.name as equipment_name,
  e.rarity
FROM character_equipped ce
JOIN user_characters uc ON ce.user_character_id = uc.id
JOIN characters c ON uc.character_id = c.id
JOIN users u ON uc.user_id = u.id
JOIN user_equipment ue ON ce.user_equipment_id = ue.id
JOIN equipment e ON ue.equipment_id = e.id
WHERE u.discord_id = 'SEU_DISCORD_ID';
```

---

## 🎯 Ordem Correta de Execução:

```bash
# 1. Gerar migration
cd lib/db
pnpm drizzle-kit generate

# 2. Aplicar migration
pnpm run migrate

# 3. Seed de equipamentos
pnpm run seed:equipment

# 4. Dar equipamentos via SQL (opcional, para teste manual)
# (use os comandos SQL do passo 4)

# 5. Rodar o bot
cd ~/workspace
pnpm --filter @workspace/api-server run bot

# 6. Testar no Discord!
```

---

Pronto para testar! 🚀
