# 🎁 Sistema de Loot Box - Design Completo

## 🎯 Conceito

Sistema de loja com **Loot Boxes** compráveis com Gemas, contendo recompensas variadas:
- 💰 Gold e Tickets
- ⚔️ Equipamentos (Common → Mythic)
- ✨ XP de Maestria para personagens da equipe
- 🎟️ Itens especiais
- 🎲 Sistema de raridade e garantias

---

## 📦 Tipos de Loot Box

### 1. **Caixa Básica** (Common Box) 💚
**Preço:** 50 Gemas

**Conteúdo:**
- 3 recompensas garantidas
- **Pool de Recompensas:**
  - 💰 Gold: 100-500 (60% chance)
  - 🎟️ Tickets: 1-3 (25% chance)
  - ⚔️ Equipamento Common/Uncommon (10% chance)
  - ✨ XP Maestria: 50-100 (5% chance)

**Garantia:** Pelo menos 1 recompensa de valor (gold/tickets)

---

### 2. **Caixa Avançada** (Advanced Box) 💙
**Preço:** 150 Gemas

**Conteúdo:**
- 5 recompensas garantidas
- **Pool de Recompensas:**
  - 💰 Gold: 300-1000 (40% chance)
  - 🎟️ Tickets: 3-7 (30% chance)
  - ⚔️ Equipamento Uncommon/Rare (20% chance)
  - ✨ XP Maestria: 100-250 (8% chance)
  - 💎 Gemas Bônus: 10-30 (2% chance)

**Garantia:** Pelo menos 1 equipamento Uncommon+ ou 500+ gold

---

### 3. **Caixa Épica** (Epic Box) 💜
**Preço:** 400 Gemas

**Conteúdo:**
- 7 recompensas garantidas
- **Pool de Recompensas:**
  - 💰 Gold: 800-2500 (30% chance)
  - 🎟️ Tickets: 5-15 (25% chance)
  - ⚔️ Equipamento Rare/Epic (30% chance)
  - ✨ XP Maestria: 250-500 (10% chance)
  - 💎 Gemas Bônus: 30-100 (4% chance)
  - 🎴 Personagem Aleatório Rare+ (1% chance)

**Garantia:** Pelo menos 1 equipamento Rare+ E 1000+ gold

---

### 4. **Caixa Lendária** (Legendary Box) 🟡
**Preço:** 1000 Gemas

**Conteúdo:**
- 10 recompensas garantidas
- **Pool de Recompensas:**
  - 💰 Gold: 2000-5000 (25% chance)
  - 🎟️ Tickets: 10-30 (20% chance)
  - ⚔️ Equipamento Epic/Legendary (35% chance)
  - ✨ XP Maestria: 500-1000 (15% chance)
  - 💎 Gemas Bônus: 100-300 (4% chance)
  - 🎴 Personagem Aleatório Epic+ (0.8% chance)
  - 🌟 Item Especial (0.2% chance)

**Garantia:** Pelo menos 1 equipamento Epic+ E 1 XP Maestria 500+

---

### 5. **Caixa Mítica** (Mythic Box) 🔴
**Preço:** 2500 Gemas

**Conteúdo:**
- 15 recompensas garantidas
- **Pool de Recompensas:**
  - 💰 Gold: 5000-10000 (20% chance)
  - 🎟️ Tickets: 20-50 (15% chance)
  - ⚔️ Equipamento Legendary/Mythic (40% chance)
  - ✨ XP Maestria: 1000-2000 (15% chance)
  - 💎 Gemas Bônus: 200-500 (8% chance)
  - 🎴 Personagem Aleatório Legendary+ (1.5% chance)
  - 🌟 Item Especial (0.5% chance)

**Garantia:** 
- Pelo menos 2 equipamentos Legendary+
- Pelo menos 1 XP Maestria 1000+
- Pelo menos 5000 gold

---

## ✨ Sistema de XP de Maestria

### Como Funciona:
1. **Loot Box dropa XP de Maestria**
2. **Ao abrir, você escolhe 1 personagem da sua equipe**
3. **XP é aplicado diretamente ao personagem escolhido**
4. **Pode subir múltiplos níveis de maestria de uma vez**

### Exemplo:
```
Você abriu: Caixa Épica
Recompensas:
• 1200 Gold
• 8 Tickets
• Katana Afiada [Epic]
• ✨ 500 XP de Maestria

Escolha um personagem da sua equipe para receber 500 XP:
1️⃣ Naruto (Maestria Lv 5 - 200/300 XP)
2️⃣ Sasuke (Maestria Lv 3 - 50/200 XP)
3️⃣ Zoro (Maestria Lv 8 - 500/800 XP)

Você escolheu: Naruto
✅ Naruto ganhou 500 XP!
🎉 Naruto subiu para Maestria Lv 7! (200 XP restante aplicado)
```

---

## 🎲 Sistema de Pity (Garantia Progressiva)

### Soft Pity:
- A cada **5 caixas** sem equipamento Epic+:
  - Próxima caixa tem **+20% chance** de equipamento raro

### Hard Pity:
- A cada **10 caixas** sem equipamento Legendary+:
  - **Garantia** de 1 equipamento Legendary na próxima

### Contador de Pity:
- Visível no comando `/loja`
- Reset ao obter item de alta raridade
- Separado por tipo de caixa

---

## 🌟 Itens Especiais

### 1. **Fragmento de Personagem** 🧩
- Junte 10 fragmentos = 1 personagem Epic garantido
- Junte 25 fragmentos = 1 personagem Legendary garantido

### 2. **Poção de Experiência** 🧪
- +500 XP para 1 personagem da equipe
- Acumula no inventário

### 3. **Talismã de Sorte** 🍀
- Próxima invocação tem +10% de chance de personagem raro
- Uso único

### 4. **Chave Dourada** 🔑
- Abre "Caixa Secreta" especial
- Recompensas exclusivas

---

## 💎 Descontos e Promoções

### 1. **Pacote de 3 Caixas**
```
Caixa Básica x3: 120 Gemas (20% OFF)
Caixa Avançada x3: 360 Gemas (20% OFF)
Caixa Épica x3: 960 Gemas (20% OFF)
```

### 2. **Pacote de 10 Caixas**
```
Caixa Básica x10: 350 Gemas (30% OFF)
Caixa Avançada x10: 1050 Gemas (30% OFF)
Caixa Épica x10: 2800 Gemas (30% OFF)
```

### 3. **Promoção Semanal**
- 1 tipo de caixa com **50% OFF**
- Rotaciona semanalmente

### 4. **First Purchase Bonus**
- Primeira compra de cada tipo: **Dobro de recompensas**

---

## 📊 Histórico de Aberturas

### Tracking:
- Últimas 20 aberturas salvas
- Estatísticas:
  - Total de caixas abertas
  - Melhores drops
  - Total de gemas gastas
  - Total de recompensas obtidas

### Comando:
```
/lootbox historico
```

**Exemplo:**
```
📊 Histórico de Loot Boxes

Total Aberto: 47 caixas
Gemas Gastas: 8,500 💎
Melhores Drops: Espada Lendária, 3x Personagens Épicos

Últimas Aberturas:
1. Caixa Épica - 2h atrás
   └─ Katana Afiada [Epic], 500 XP, 1200 Gold
2. Caixa Básica - 5h atrás
   └─ 300 Gold, 2 Tickets
3. Caixa Lendária - 1d atrás
   └─ Escudo Mítico [Mythic], Sasuke [Epic], 1500 XP
```

---

## 🎮 Comandos

### `/loja`
Abre a loja de loot boxes com menu interativo

**Exibe:**
- Todos os tipos de caixas
- Preços e conteúdos
- Saldo atual de gemas
- Contador de pity
- Promoções ativas

### `/lootbox abrir <tipo> [quantidade]`
Abre loot box(es)

**Exemplos:**
```
/lootbox abrir tipo:Básica
/lootbox abrir tipo:Épica quantidade:3
/lootbox abrir tipo:Mítica quantidade:10
```

### `/lootbox historico`
Ver histórico de aberturas e estatísticas

### `/lootbox info <tipo>`
Ver detalhes completos de um tipo de caixa

---

## 🎨 Animação de Abertura

### Sequência:
1. **Caixa aparece** com animação de entrada
2. **Giro dramático** (3 segundos)
3. **Revelação item por item** (0.5s cada)
4. **Efeito de raridade:**
   - Common: ⚪ Brilho branco
   - Uncommon: 🟢 Brilho verde
   - Rare: 🔵 Brilho azul
   - Epic: 🟣 Brilho roxo
   - Legendary: 🟡 Brilho dourado
   - Mythic: 🔴 Brilho vermelho + estrelas

### Para Múltiplas Caixas:
- Modo "Rápido": Todas de uma vez
- Modo "Normal": Uma por uma
- Modo "Cinematográfico": Com delays e efeitos

---

## 💰 Preços em Gemas

| Tipo | Preço Unit. | Pack 3 | Pack 10 |
|------|-------------|--------|---------|
| Básica | 50 💎 | 120 💎 | 350 💎 |
| Avançada | 150 💎 | 360 💎 | 1050 💎 |
| Épica | 400 💎 | 960 💎 | 2800 💎 |
| Lendária | 1000 💎 | 2400 💎 | 7000 💎 |
| Mítica | 2500 💎 | 6000 💎 | 17500 💎 |

---

## 📈 Balanceamento

### Valor Médio por Caixa:

**Básica (50 💎):**
- Valor médio: 350 gold equivalente
- ROI: 7x (em gold)

**Avançada (150 💎):**
- Valor médio: 1200 gold equivalente
- ROI: 8x

**Épica (400 💎):**
- Valor médio: 3500 gold equivalente
- ROI: 8.75x

**Lendária (1000 💎):**
- Valor médio: 10000 gold equivalente
- ROI: 10x

**Mítica (2500 💎):**
- Valor médio: 30000 gold equivalente
- ROI: 12x

---

## 🎯 Mecânicas Especiais

### 1. **Luck Streak** 🍀
- 5 aberturas consecutivas em 1 hora: +5% chance de raridade alta
- 10 aberturas: +10%
- 20 aberturas: +15%

### 2. **Daily Free Box** 🎁
- 1 Caixa Básica grátis por dia
- Reseta às 00:00 UTC

### 3. **Jackpot** 🎰
- 0.1% chance de **JACKPOT** em qualquer caixa
- Jackpot = **Dobro** de todas as recompensas da caixa

### 4. **Mystery Box** ❓
- Aparece aleatoriamente na loja (1x/semana)
- Preço: 500 Gemas
- Conteúdo: **Completamente aleatório** (pode ser incrível ou ruim)

---

## 🔮 Itens Exclusivos de Loot Box

### Equipamentos Exclusivos:
1. **Colar da Sorte** [Mythic]
   - +5% chance de drop em todas as atividades
   - Só disponível em Loot Box

2. **Anel da Fortuna** [Legendary]
   - +10% Gold ganho
   - Só disponível em Loot Box

3. **Amuleto do Destino** [Epic]
   - +5% XP de Maestria
   - Só disponível em Loot Box

---

## 📊 Schema do Banco

```typescript
// Tabela de histórico de aberturas
loot_box_openings:
  - id: UUID
  - user_id: UUID
  - box_type: TEXT (basic, advanced, epic, legendary, mythic)
  - gems_spent: INTEGER
  - rewards: JSONB
  - opened_at: TIMESTAMP
  
// Tabela de pity tracking
loot_box_pity:
  - user_id: UUID (PK)
  - box_type: TEXT (PK)
  - counter: INTEGER
  - last_rare_at: TIMESTAMP
```

---

## 🎉 Eventos Especiais

### 1. **Happy Hour**
- 2 horas por dia (horário aleatório)
- Todas as caixas: **+50% recompensas**

### 2. **Weekend Bonanza**
- Sábado e Domingo
- Pack de 10: **40% OFF** (ao invés de 30%)

### 3. **Evento Sazonal**
- Natal, Ano Novo, etc
- **Caixa Especial Limitada** com itens exclusivos

---

Esse sistema está pronto para implementar! Quer que eu comece a criar o código agora? 🚀
