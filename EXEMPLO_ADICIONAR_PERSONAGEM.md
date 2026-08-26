# 📝 Guia Prático: Como Adicionar um Personagem

## Passo a passo completo

### 1. Abra o arquivo de personagens

```
lib/db/src/data/characters.ts
```

### 2. Copie este template

```typescript
{
  anime: "Nome do Anime",
  name: "Nome do Personagem",
  rarity: "common", // common, uncommon, rare, epic, legendary, mythic
  role: "dps", // dps, tank, healer, support
  baseHp: 1000,
  baseAttack: 150,
  baseDefense: 100,
  baseSpeed: 100,
  imageUrl: "https://url-da-imagem.png",
  passive: "Descrição da habilidade passiva",
  ultimate: {
    id: "identificador_unico_minusculo",
    name: "Nome da Ultimate",
    description: "Descrição do que a ultimate faz",
    chargeRequired: 100, // quanto de carga precisa
    chargeOnBasic: 20, // carga ganha em ataque básico
    chargeOnDamageTaken: 10, // carga ganha ao receber dano
    chargeOnCritical: 5, // carga extra em crítico
    type: "DAMAGE", // DAMAGE, HEAL, BUFF, DEBUFF, STUN, DOT, SHIELD, AOE, EXECUTE, REVIVE
    targetType: "single_enemy", // single_enemy, aoe_enemy, single_ally, aoe_ally, self
    multiplier: 2.5, // multiplicador de dano/cura
    statusEffects: [], // efeitos de status (veja exemplos abaixo)
    conditionalRules: [], // regras condicionais (veja exemplos abaixo)
  },
},
```

### 3. Exemplos reais

#### Exemplo 1: DPS de alto dano

```typescript
{
  anime: "Bleach",
  name: "Kenpachi Zaraki",
  rarity: "legendary",
  role: "dps",
  baseHp: 1300,
  baseAttack: 260,
  baseDefense: 100,
  baseSpeed: 95,
  imageUrl: "https://exemplo.com/kenpachi.png",
  passive: "Sede de Batalha: aumenta ataque a cada turno de combate",
  ultimate: {
    id: "kenpachi_slash",
    name: "Corte Devastador",
    description: "Um corte brutal que causa dano massivo e sangramento",
    chargeRequired: 100,
    chargeOnBasic: 25,
    chargeOnDamageTaken: 15,
    chargeOnCritical: 10,
    type: "DAMAGE",
    targetType: "single_enemy",
    multiplier: 3.5,
    statusEffects: [
      { type: "bleed", chance: 100, duration: 3, value: 80 }
    ],
    conditionalRules: [
      {
        condition: "HP abaixo de 30%",
        effect: "multiplicador aumenta em 1.0"
      }
    ],
  },
},
```

#### Exemplo 2: Healer de suporte

```typescript
{
  anime: "Fairy Tail",
  name: "Wendy Marvell",
  rarity: "rare",
  role: "healer",
  baseHp: 850,
  baseAttack: 110,
  baseDefense: 120,
  baseSpeed: 105,
  imageUrl: "https://exemplo.com/wendy.png",
  passive: "Magia Celestial: regenera pequena quantidade de HP dos aliados por turno",
  ultimate: {
    id: "wendy_sky_healing",
    name: "Magia do Céu: Cura Divina",
    description: "Restaura HP de todos os aliados e remove debuffs",
    chargeRequired: 110,
    chargeOnBasic: 18,
    chargeOnDamageTaken: 20,
    chargeOnCritical: 0,
    type: "HEAL",
    targetType: "aoe_ally",
    multiplier: 2.5,
    statusEffects: [
      { type: "defense_up", chance: 100, duration: 2, value: 25 }
    ],
    conditionalRules: [
      {
        condition: "Aliado com HP crítico",
        effect: "cura é priorizada no aliado mais ferido"
      }
    ],
  },
},
```

#### Exemplo 3: Tank defensivo

```typescript
{
  anime: "My Hero Academia",
  name: "Eijiro Kirishima",
  rarity: "uncommon",
  role: "tank",
  baseHp: 1400,
  baseAttack: 130,
  baseDefense: 180,
  baseSpeed: 85,
  imageUrl: "https://exemplo.com/kirishima.png",
  passive: "Endurecimento: reduz dano físico recebido",
  ultimate: {
    id: "kirishima_red_riot",
    name: "Red Riot: Unbreakable",
    description: "Maximiza defesa e taunts inimigos para proteger aliados",
    chargeRequired: 95,
    chargeOnBasic: 15,
    chargeOnDamageTaken: 25,
    chargeOnCritical: 0,
    type: "BUFF",
    targetType: "self",
    multiplier: 0,
    statusEffects: [
      { type: "defense_up", chance: 100, duration: 3, value: 60 },
      { type: "shield", chance: 100, duration: 2, value: 300 }
    ],
    conditionalRules: [
      {
        condition: "Enquanto ativo",
        effect: "atrai ataques inimigos para si"
      }
    ],
  },
},
```

### 4. Efeitos de Status Disponíveis

```typescript
statusEffects: [
  // Dano ao longo do tempo
  { type: "burn", chance: 80, duration: 3, value: 50 },      // Queimadura
  { type: "poison", chance: 70, duration: 4, value: 40 },    // Veneno
  { type: "bleed", chance: 90, duration: 2, value: 60 },     // Sangramento
  
  // Controle
  { type: "stun", chance: 50, duration: 1, value: 0 },       // Atordoamento
  { type: "freeze", chance: 60, duration: 2, value: 0 },     // Congelamento
  { type: "shock", chance: 70, duration: 2, value: 30 },     // Choque elétrico
  
  // Buffs
  { type: "attack_up", chance: 100, duration: 2, value: 30 },    // +30% ataque
  { type: "defense_up", chance: 100, duration: 2, value: 25 },   // +25% defesa
  { type: "speed_up", chance: 100, duration: 2, value: 20 },     // +20% velocidade
  { type: "shield", chance: 100, duration: 2, value: 200 },      // Escudo de 200 HP
  
  // Debuffs
  { type: "attack_down", chance: 80, duration: 2, value: 20 },   // -20% ataque
  { type: "defense_down", chance: 80, duration: 2, value: 25 },  // -25% defesa
  { type: "speed_down", chance: 70, duration: 2, value: 30 },    // -30% velocidade
]
```

### 5. Cole no array characterCatalog

Adicione sua configuração dentro do array `characterCatalogSchema.parse([...])`:

```typescript
export const characterCatalog: CharacterCatalogEntry[] =
  characterCatalogSchema.parse([
    // ... personagens existentes ...
    
    // SEU NOVO PERSONAGEM AQUI
    {
      anime: "Attack on Titan",
      name: "Levi Ackerman",
      // ... resto da config
    },
  ]);
```

### 6. Salve o arquivo

Aperte `Ctrl+S` (Windows) ou `Cmd+S` (Mac)

### 7. Aguarde a sincronização

Você verá no console do servidor:

```
[db] Mudança detectada no catálogo, sincronizando...
[db] Catálogo sincronizado automaticamente { count: 11 }
```

### 8. Teste!

O personagem já está disponível no jogo! 🎉

## Dicas Importantes

### ✅ Faça

- Use nomes únicos por anime (Ex: "Naruto - Naruto Uzumaki" é diferente de "Naruto - Sasuke")
- Teste com raridades baixas primeiro (common/uncommon) para ajustar stats
- Use URLs de imagens permanentes (não temporárias)
- Adicione descrições claras nas passivas e ultimates
- Balance os atributos base (veja personagens similares)

### ❌ Não faça

- Não repita combinação de anime + nome (causa erro)
- Não use valores negativos em stats
- Não esqueça de fechar chaves e vírgulas corretamente
- Não use caracteres especiais no ID da ultimate
- Não copie/cole sem ajustar os valores

## Guia de Balanceamento

### Stats por Raridade (Média)

```
Common:      HP: 800-900    ATK: 120-140   DEF: 90-110    SPD: 95-105
Uncommon:    HP: 900-1000   ATK: 140-170   DEF: 100-120   SPD: 100-110
Rare:        HP: 1000-1150  ATK: 170-200   DEF: 110-130   SPD: 105-118
Epic:        HP: 1100-1250  ATK: 200-240   DEF: 120-145   SPD: 110-125
Legendary:   HP: 1200-1400  ATK: 230-270   DEF: 130-160   SPD: 115-130
Mythic:      HP: 1300-1500  ATK: 260-300   DEF: 140-180   SPD: 120-135
```

### Stats por Role

```
DPS:      HP: médio    ATK: alto     DEF: baixo    SPD: alto
Tank:     HP: muito alto    ATK: baixo    DEF: muito alto    SPD: baixo
Healer:   HP: médio-baixo   ATK: baixo    DEF: médio    SPD: médio
Support:  HP: médio    ATK: médio    DEF: médio    SPD: alto
```

### Carga da Ultimate

```
Rápida:    85-95    (ativa frequentemente)
Normal:    95-110   (balanceado)
Lenta:     110-140  (muito poderosa)
```

## Troubleshooting

### Erro: "anime + name must be unique"

Você tem um personagem duplicado. Verifique se já existe essa combinação.

### Erro de validação Zod

Verifique:
- Todos os campos obrigatórios estão preenchidos?
- Os valores estão no formato correto?
- As vírgulas estão nos lugares certos?
- Você fechou todas as chaves `{}`?

### Personagem não aparece

1. Verifique os logs do servidor
2. Tente sincronização manual: `node test-auto-sync.mjs sync`
3. Verifique se salvou o arquivo
4. Aguarde até 5 segundos

## Scripts Úteis

```bash
# Verificar se há mudanças pendentes
node test-auto-sync.mjs status

# Forçar sincronização imediata
node test-auto-sync.mjs sync

# Ver logs do servidor
# (no terminal onde o servidor está rodando)
```

## Próximos Passos

Depois de adicionar o personagem:

1. ✅ Teste invocá-lo no Discord (`/invocar`)
2. ✅ Verifique os stats (`/personagem [id]`)
3. ✅ Teste em batalha (`/batalha-pve`)
4. ✅ Ajuste balanceamento se necessário

---

**Dúvidas?** Veja também:
- `CATALOG_AUTO_SYNC.md` - Documentação completa do sistema
- `.agents/memory/auto-catalog-sync.md` - Detalhes técnicos
