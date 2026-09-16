# 🎨 Sistema de Banners para Personagens

## 📋 Visão Geral

Adicionado campo `bannerUrl` aos personagens para permitir imagens de banner widescreen que ficam mais impressionantes nos embeds do Discord.

## ✨ Como Funciona

### Exibição nos Embeds

Quando um personagem tem `bannerUrl` configurado:
- **Banner**: Exibido como imagem principal (`.setImage()`)
- **Avatar**: Exibido como thumbnail (`.setThumbnail()`)

Quando **NÃO** tem banner:
- **Avatar**: Exibido como imagem principal (comportamento padrão)

### Comandos Afetados

✅ **`/invocar`** - Invocação de personagens
- Banner aparece na imagem principal
- Avatar como thumbnail pequeno no canto

✅ **`/perfil`** - Perfil do jogador
- Se personagem de banner tiver `bannerUrl`, usa banner + thumbnail
- Senão usa imagem normal

✅ **`/personagem <nome>`** - Detalhes do personagem
- Banner como imagem principal
- Avatar como thumbnail

## 🗄️ Estrutura do Banco

### Migration: `0011_add_character_banner.sql`

```sql
ALTER TABLE "characters" ADD COLUMN "banner_url" text;
```

### Schema: `characters` table

```typescript
{
  // ... outros campos
  imageUrl: text("image_url"),
  bannerUrl: text("banner_url"), // NOVO!
  // ... outros campos
}
```

### Schema: `characterCatalogEntrySchema`

```typescript
{
  // ... outros campos
  imageUrl: optionalImageUrlSchema,
  bannerUrl: optionalImageUrlSchema.optional(), // NOVO!
  // ... outros campos
}
```

## 📝 Como Adicionar Banners

### Opção 1: Via Script (Recomendado)

Edite o arquivo `lib/db/scripts/add-character-banners.mjs` e adicione:

```javascript
const bannerUpdates = [
  {
    anime: "Nome do Anime",
    name: "Nome do Personagem",
    bannerUrl: "https://url-do-banner.com/imagem.png",
  },
  // ... mais personagens
];
```

Execute:
```bash
node lib/db/scripts/add-character-banners.mjs
```

### Opção 2: SQL Direto

```sql
UPDATE characters
SET banner_url = 'https://url-do-banner.com/imagem.png'
WHERE anime = 'Nome do Anime' 
  AND name = 'Nome do Personagem';
```

### Opção 3: No Catálogo (seed)

Ao adicionar personagens novos no `characters.ts`:

```typescript
{
  anime: "Naruto",
  name: "Naruto Uzumaki",
  // ... outros campos
  imageUrl: "https://url-avatar.png",
  bannerUrl: "https://url-banner-widescreen.png", // NOVO!
  // ... outros campos
}
```

## 🎯 Recomendações de Imagens

### Avatar (`imageUrl`)
- **Formato**: Quadrado ou retrato (1:1 ou 3:4)
- **Tamanho ideal**: 512x512 ou maior
- **Foco**: Rosto/busto do personagem
- **Uso**: Thumbnail, ícones, listagens

### Banner (`bannerUrl`)
- **Formato**: Widescreen (16:9 ou 21:9)
- **Tamanho ideal**: 1920x1080 ou maior
- **Foco**: Cena épica, arte panorâmica
- **Uso**: Imagem principal em invocações e detalhes

## 🔍 Exemplos de URLs

### Boas Fontes de Banners

1. **Alpha Coders**: https://wall.alphacoders.com/
   - Buscar: "Character Name Banner"
   - Filtrar por resolução 1920x1080+

2. **Wallpaper Abyss**: https://wall.alphacoders.com/
   - Categorias de Anime

3. **DeviantArt**: https://www.deviantart.com/
   - Buscar: "Character Name Banner"
   - Verificar licença de uso!

## 💡 Dicas

### Priorização

Adicione banners para:
1. ✅ **Personagens Legendary/Mythic** (maior impacto visual)
2. ✅ **Personagens mais populares** (Naruto, Goku, Luffy, etc)
3. ✅ **Personagens de banner promocional** (banners limitados)
4. ⚪ Personagens Common/Uncommon (opcional)

### Performance

- URLs devem ser **hospedadas externamente** (CDNs)
- Evitar imagens >5MB (Discord pode ter limite)
- Preferir PNG ou JPEG otimizado
- Discord faz cache automático

## 🧪 Testando

```bash
# 1. Aplicar migration
node lib/db/scripts/apply-all-migrations.mjs

# 2. Adicionar banners de exemplo
node lib/db/scripts/add-character-banners.mjs

# 3. Invocar personagem no Discord
/invocar single

# 4. Ver detalhes
/personagem Naruto Uzumaki

# 5. Ver perfil com banner
/perfil banner Naruto Uzumaki
```

## 🎨 Antes e Depois

### Sem Banner (Antes)
```
┌─────────────────────┐
│  🌟 Naruto Uzumaki  │
│                     │
│  [Anime] Raridade   │
│  Stats...           │
│                     │
│  ┌─────────┐        │
│  │ Avatar  │        │
│  │ 512x512 │        │
│  └─────────┘        │
└─────────────────────┘
```

### Com Banner (Depois)
```
┌─────────────────────┐
│  🌟 Naruto Uzumaki  │
│                     │
│  [Anime] Raridade   │
│  Stats...           │
│                     │
│  ┌──────────────┐   │
│  │   BANNER     │   │
│  │  1920x1080   │   │
│  └──────────────┘   │
│  ┌──┐               │
│  │🖼️│ Avatar thumb  │
│  └──┘               │
└─────────────────────┘
```

## 📊 Estatísticas

Após implementação:
- **Campo adicionado**: `characters.banner_url`
- **Comandos atualizados**: 3 (`/invocar`, `/personagem`, `/perfil`)
- **Retrocompatibilidade**: ✅ Total (funciona sem banner)
- **Migration**: `0011_add_character_banner.sql`

## 🚀 Deploy

Após fazer alterações:

```bash
# 1. Aplicar migration
node lib/db/scripts/apply-all-migrations.mjs

# 2. Rebuild
cd artifacts/api-server && node build.mjs && cd ../..

# 3. Commit
git add lib/db/drizzle/0011_add_character_banner.sql
git add lib/db/src/schema/index.ts
git add lib/db/src/data/characters.ts
git add artifacts/api-server/src/bot/embeds.ts
git add artifacts/api-server/src/bot/handlers.ts
git add artifacts/api-server/dist/
git commit -m "feat: adicionar campo banner em personagens"
git push

# 4. Re-deploy no Discloud
```

## ✅ Checklist de Implementação

- [x] Adicionar campo `bannerUrl` no schema TypeScript
- [x] Criar migration SQL `0011_add_character_banner.sql`
- [x] Atualizar `createSummonResultEmbeds` para usar banner
- [x] Atualizar comando `/personagem` para usar banner
- [x] Atualizar `createEnhancedProfileEmbed` para usar banner
- [x] Criar script `add-character-banners.mjs` para popular dados
- [x] Documentar em `CHARACTER_BANNERS.md`
- [ ] Aplicar migration no banco (você)
- [ ] Popular banners de personagens principais (você)
- [ ] Testar no Discord (você)

## 🎉 Pronto!

Agora os personagens podem ter banners épicos que tornam as invocações muito mais impressionantes visualmente! 🌟
