# 🎯 Sistema de Formação e Counter/Weakness

Sistema estratégico completo que torna as batalhas mais táticas!

## ✅ O Que Foi Implementado

### 1. **Schema do Banco de Dados**

**Novos Enums:**
- `element_type`: fire, water, electric, earth, wind, light, dark, neutral
- `position_type`: front, mid, back

**Novos Campos:**
- `characters.element` - Elemento do personagem
- `characters.default_position` - Posição padrão recomendada
- `team_members.battle_position` - Posição tática em batalha

**Migration:** `0007_formation_and_elements.sql`

### 2. **FormationService** (`artifacts/api-server/src/services/FormationService.ts`)

Sistema completo de cálculo de modificadores de dano com:

#### 🔥 Vantagens Elementais (50% mais/menos dano)
```
Fogo > Terra > Água > Fogo
Elétrico > Água | Vento
Terra > Elétrico
Luz ⟷ Trevas (mútuo)
Neutral = sem vantagem
```

#### 🎯 Counters de Papel (25% modificador)
```
DPS > Suporte (mata rápido)
Tank > DPS (aguenta dano)
Suporte > Tank (cura supera)
Controle = 10% bônus contra todos
```

#### 📍 Modificadores de Posição

**Front (Frente):**
- +10% dano causado
- +20% dano recebido
- Melhor para: Tanks

**Mid (Meio):**
- Balanceado (sem modificadores)
- Melhor para: DPS

**Back (Retaguarda):**
- +15% dano causado
- -10% dano recebido
- Melhor para: Suportes e Controle

#### 🎪 Posição vs Posição
```
Back → Front = +10% (alvo exposto)
Front → Back = -15% (muito longe)
Mid = equilíbrio
```

### 3. **Funções Disponíveis**

```typescript
// Calcula todos os modificadores
calculateDamageModifiers(
  attackerElement,
  defenderElement,
  attackerRole,
  defenderRole,
  attackerPosition,
  defenderPosition
): DamageModifiers

// Aplica ao dano
applyDamageModifiers(baseDamage, modifiers): number

// Posição recomendada por role
getRecommendedPosition(role): PositionType

// Emojis visuais
getElementEmoji(element): string
getPositionEmoji(position): string
getModifierEmoji(totalModifier): string
```

## 🚧 O Que Falta Fazer

### 1. **Aplicar Migration**
```bash
cd lib/db
pnpm run migrate
```

Ou manualmente:
```sql
CREATE TYPE "element_type" AS ENUM ('fire', 'water', 'electric', 'earth', 'wind', 'light', 'dark', 'neutral');
CREATE TYPE "position_type" AS ENUM ('front', 'mid', 'back');
ALTER TABLE "characters" ADD COLUMN "element" "element_type" NOT NULL DEFAULT 'neutral';
ALTER TABLE "characters" ADD COLUMN "default_position" "position_type" NOT NULL DEFAULT 'mid';
ALTER TABLE "team_members" ADD COLUMN "battle_position" "position_type" NOT NULL DEFAULT 'mid';
```

### 2. **Integrar no BattleEngine**

Modificar `BattleEngine.ts` para usar `FormationService`:

```typescript
// No cálculo de dano (linha ~400):
import { calculateDamageModifiers, applyDamageModifiers } from './FormationService';

const modifiers = calculateDamageModifiers(
  attacker.element,
  target.element,
  attacker.role,
  target.role,
  attacker.position,
  target.position
);

const finalDamage = applyDamageModifiers(baseDamage, modifiers);

// Logar modificadores
this.logger.log(`${modifiers.description.join(' | ')}`);
this.logger.log(`Dano: ${baseDamage} → ${finalDamage} (${getModifierEmoji(modifiers.total)})`);
```

### 3. **Atualizar Seed de Personagens**

Adicionar elemento e posição aos personagens em `characters.ts`:

```typescript
{
  name: "Goku",
  element: "fire",        // ← NOVO
  defaultPosition: "mid", // ← NOVO
  role: "dps",
  // ...
}
```

Sugestões de elementos:
- **Fogo:** Goku, Natsu, Ace, Rengoku
- **Água:** Tanjiro, Juvia, Katara
- **Elétrico:** Killua, Zenitsu, Pikachu
- **Terra:** Gaara, Toph
- **Vento:** Naruto (Rasengan), Aang
- **Luz:** Asta (anti-magia), Escanor
- **Trevas:** Sasuke, Madara
- **Neutral:** Saitama, Levi

### 4. **Comando `/formacao`**

Criar comando para configurar formação:

```
/formacao personagem:<char> posição:<front/mid/back>
```

Mostra:
- Posição atual
- Posição recomendada
- Modificadores de dano
- Preview de formação do time

### 5. **UI Visual da Formação**

Adicionar ao `/equipe`:

```
📊 Sua Equipe

🛡️ FRENTE
  └─ Tank1 (🔥 Fogo)

⚔️ MEIO  
  └─ DPS1 (⚡ Elétrico)
  └─ DPS2 (💧 Água)

🏹 RETAGUARDA
  └─ Suporte1 (✨ Luz)
```

### 6. **Mostrar Modificadores em Batalha**

Adicionar ao log de dano:

```
🔥 Goku ataca 💧 Tanjiro
⚡ Vantagem Elemental: fogo < água (-25%)
📍 Posição mid: normal
🎯 Alvo em front: +5% precisão
⚔️ RESISTIDO - 450 dano
```

## 🎮 Como Testar

1. Aplicar migration
2. Fazer build: `cd artifacts/api-server && pnpm run build`
3. Rodar bot: `pnpm run bot`
4. Usar `/arena` e observar logs de dano com modificadores
5. Usar `/formacao` para reposicionar personagens
6. Ver diferença nos resultados!

## 📊 Exemplo de Combate

**Cenário 1: Vantagem Total**
- Goku (🔥 Fogo, Front, DPS) 
- VS 
- Gaara (🌍 Terra, Mid, Suporte)

Modificadores:
- Elemento: +50% (fogo > terra)
- Role: +25% (dps > suporte)
- Posição: +10% (front dano)
- Posição vs Posição: +5% (front → mid fácil)
- **Total: ~2.0x (DEVASTADOR!)** 🔥🔥🔥

**Cenário 2: Desvantagem**
- Tanjiro (💧 Água, Back, Suporte)
- VS
- Killua (⚡ Elétrico, Mid, DPS)

Modificadores:
- Elemento: -25% (água < elétrico)
- Role: -15% (suporte < dps)
- Posição: +15% (back dano)
- Posição: -10% (alvo mid dano reduzido)
- **Total: ~0.65x (RESISTIDO)** 🛡️

## 💡 Dicas Estratégicas

1. **Balance Elemental** - Tenha variedade de elementos no time
2. **Posicionamento** - Tanks na frente, suportes atrás
3. **Counter Pick** - Veja o time inimigo e contra-ataque
4. **Sinergia** - Mid position é versátil
5. **Trade-offs** - Front dá mais dano mas recebe mais

## 🔮 Futuras Expansões

- **Formações Especiais:** "Muro de Aço" (3 tanks front), "Sniper Team" (3 back)
- **Buffs de Formação:** Bônus quando todos estão na mesma linha
- **Rotação de Posição:** Trocar posição mid-battle
- **Terreno:** Mapa afeta elementos (vulcão = fogo +20%)
