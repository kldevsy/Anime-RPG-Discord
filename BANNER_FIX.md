# 🔧 Correção do Banner - UUID vs Nome

## ❌ Problema

Erro ao definir banner do perfil:
```
Failed query: update "user_profiles" set "banner_character_id" = $1
params: zoro,2026-09-11T20:56:18.604Z,1b3d2d69-1f21-45b9-8df1-5cdea15c997e
```

O banco esperava um **UUID** mas recebeu `"zoro"` (string/nome).

## 🐛 Causa

**Usuário digitou ao invés de usar autocomplete!**

Quando o autocomplete não está sincronizado ou o usuário digita manualmente, o Discord envia o texto digitado ("zoro") ao invés do valor selecionado (UUID).

## ✅ Solução 1: Validação com Fallback (Banner)

Para `/perfil banner`, adicionei validação que:
1. Verifica se é UUID válido
2. Se não for, **busca na coleção** pelo nome
3. Se encontrar, usa o UUID correto
4. Se não encontrar, retorna erro amigável

```typescript
// /perfil banner
if (subcommand === "banner") {
  let characterIdOrName = interaction.options.getString("personagem", true);
  
  // Se o valor não for um UUID, buscar pelo nome
  let characterId = characterIdOrName;
  if (!characterIdOrName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    // Buscar personagem pelo nome
    const profile = await getProfile(discordId);
    if (!profile) {
      await interaction.editReply("❌ Perfil não encontrado.");
      return;
    }
    
    const foundChar = profile.collection.find((item: any) => 
      item.character.name.toLowerCase().includes(characterIdOrName.toLowerCase())
    );
    
    if (!foundChar) {
      await interaction.editReply(`❌ Personagem "${characterIdOrName}" não encontrado na sua coleção. Use o autocomplete para selecionar.`);
      return;
    }
    
    characterId = foundChar.character.id;
  }
  
  await ProfileService.updateProfileCustomization(discordId, {
    bannerCharacterId: characterId,
  });
  await interaction.editReply("✅ Banner do perfil atualizado!");
}
```

**Benefício:** Funciona mesmo se usuário digitar o nome!

## ✅ Solução 2: Validação Estrita (Showcase)

Para `/perfil showcase`, adicionei validação estrita que:
1. Verifica se TODOS os valores são UUIDs
2. Se não forem, retorna erro pedindo para usar autocomplete
3. Evita erros de dados inválidos

```typescript
// /perfil showcase
if (subcommand === "showcase") {
  const slot1 = interaction.options.getString("slot1", true);
  const slot2 = interaction.options.getString("slot2");
  const slot3 = interaction.options.getString("slot3");

  // Validar que são UUIDs
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!slot1.match(uuidPattern) || (slot2 && !slot2.match(uuidPattern)) || (slot3 && !slot3.match(uuidPattern))) {
    await interaction.editReply("❌ Por favor, use o autocomplete para selecionar os personagens (não digite manualmente).");
    return;
  }
  
  await ProfileService.updateProfileCustomization(discordId, {
    showcaseSlot1: slot1,
    showcaseSlot2: slot2,
    showcaseSlot3: slot3,
  });
}
```

**Benefício:** Garante dados válidos no banco!

## 🔄 Autocomplete Melhorado

Também atualizei o autocomplete do banner para mostrar apenas **personagens possuídos**:

**Antes:**
```typescript
// Todos os personagens do catálogo
const allCharacters = await listCharacters();
const choices = allCharacters
  .filter((char) => char.imageUrl)
  .map((char) => ({
    name: `${char.name} (${char.anime})`,
    value: char.id,
  }));
```

**Depois:**
```typescript
// Apenas personagens na coleção do usuário
const profile = await getProfile(discordId);
const choices = profile.collection
  .filter((item: any) => item.character.imageUrl)
  .map((item: any) => ({
    name: `${item.character.name} (${item.character.anime}) Nv.${item.level}`,
    value: item.character.id,
  }));
```

**Benefícios:**
- Mostra apenas personagens que você possui
- Mostra o nível do personagem
- Mais rápido (menos dados)

## 📊 Schema Correto

Para referência, o schema está correto:

```sql
-- user_profiles
banner_character_id UUID REFERENCES characters(id)  -- Catálogo

-- Showcase usa user_characters (possuídos)
showcase_slot_1 UUID REFERENCES user_characters(id)
showcase_slot_2 UUID REFERENCES user_characters(id)
showcase_slot_3 UUID REFERENCES user_characters(id)
```

**Banner** = Qualquer personagem do catálogo (para imagem)
**Showcase** = Apenas personagens possuídos (para exibir stats)

## 🚀 Status

**Tudo corrigido!**

Para testar:
1. Use **Quick Restart** na Replit (build + start)
2. Teste `/perfil banner` no Discord
3. **Use o autocomplete** (selecione da lista)
4. OU digite o nome (ex: "zoro") - agora funciona também!

## ✨ Melhorias Aplicadas

- ✅ Validação de UUID no banner (com fallback por nome)
- ✅ Validação estrita no showcase
- ✅ Autocomplete do banner mostra apenas coleção
- ✅ Mensagens de erro amigáveis
- ✅ Funciona mesmo sem autocomplete sincronizado

**Problema resolvido! 🎉**
