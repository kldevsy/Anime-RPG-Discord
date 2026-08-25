import { EmbedBuilder } from "discord.js";

const RARITY_COLORS: Record<string, number> = {
  common: 0x95a5a6, // Gray
  uncommon: 0x2ecc71, // Green
  rare: 0x3498db, // Blue
  epic: 0x9b59b6, // Purple
  legendary: 0xf1c40f, // Gold
  mythic: 0xe74c3c, // Red
};

const RARITY_NAMES: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

export function createProfileEmbed(user: any, collectionCount: number, teamCount: number) {
  return new EmbedBuilder()
    .setTitle(`👤 Perfil de ${user.username}`)
    .setColor(0x3498db)
    .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
    .addFields(
      { name: "🆔 ID Discord", value: user.discordId, inline: true },
      { name: "💰 Gold (Ouro)", value: `${user.gold ?? 0}`, inline: true },
      { name: "💎 Gems (Gemas)", value: `${user.gems ?? 0}`, inline: true },
      { name: "🎟️ Tickets", value: `${user.tickets ?? 0}`, inline: true },
      { name: "🎴 Personagens Possuídos", value: `${collectionCount}`, inline: true },
      { name: "⚔️ Membros na Equipe", value: `${teamCount} / 5`, inline: true }
    )
    .setFooter({ text: "Anime RPG • Batalhas Automáticas por Turnos" })
    .setTimestamp();
}

export function createBannersEmbed(bannersList: any[]) {
  const embed = new EmbedBuilder()
    .setTitle("✨ Banners de Invocação Ativos")
    .setColor(0xe74c3c)
    .setDescription("Invoque personagens poderosos e complete sua equipe!");

  if (!bannersList.length) {
    embed.addFields({ name: "Nenhum banner ativo", value: "Aguarde novos eventos de invocação." });
    return embed;
  }

  for (const b of bannersList) {
    const singleCostStr = `${b.singleCost} ${b.costCurrency}`;
    const tenCostStr = `${b.tenCost} ${b.costCurrency}`;
    embed.addFields({
      name: `🔥 ${b.name} (${b.type.toUpperCase()})`,
      value: `• **ID:** \`${b.id}\`\n• **1 Invocação:** ${singleCostStr}\n• **10 Invocações:** ${tenCostStr}\n• **Soft Pity:** ${b.softPityStart} | **Hard Pity:** ${b.hardPity}`,
    });
  }

  return embed;
}

export function createSummonResultEmbed(username: string, results: any[], currency: string, cost: number) {
  const embed = new EmbedBuilder()
    .setTitle(`🌟 Resultado da Invocação de ${username}`)
    .setColor(0xf1c40f)
    .setDescription(`Você gastou **${cost} ${currency}** e invocou **${results.length}** personagem(ns)!`);

  let desc = "";
  for (let i = 0; i < results.length; i += 1) {
    const r = results[i];
    const rarityLabel = RARITY_NAMES[r.rarity] || r.rarity || "Desconhecida";
    const characterName = r.name ? `**${r.name}**` : "**Personagem desconhecido**";
    const anime = r.anime ? ` [${r.anime}]` : "";
    const teamId = r.ownedId ?? r.characterId;
    const teamIdText = teamId ? ` • ID para equipe: \`${teamId}\`` : "";
    desc += `**${i + 1}.**${anime} ${characterName} • Raridade: **${rarityLabel.toUpperCase()}**${teamIdText}\n`;
  }

  embed.addFields({ name: "🎴 Personagens Obtidos", value: desc || "Nenhum resultado." });
  return embed;
}

export function createTeamEmbed(username: string, team: any, members: any[]) {
  const embed = new EmbedBuilder()
    .setTitle(`🛡️ Equipe Principal de ${username}`)
    .setColor(0x2ecc71);

  if (!members.length) {
    embed.setDescription("Sua equipe está vazia! Use `/equipe adicionar` para escalar até 5 personagens.");
    return embed;
  }

  let text = "";
  for (const m of members) {
    const char = m.character;
    const rarityLabel = RARITY_NAMES[char.rarity] || char.rarity;
    text += `**Posição ${m.position}:** [${char.anime}] **${char.name}** (Nível ${m.level}) • *${char.role.toUpperCase()}* • ${rarityLabel}\n• **ID de Propriedade:** \`${m.ownedId}\`\n\n`;
  }

  embed.setDescription(text);
  embed.setFooter({ text: "Dica: A posição do personagem altera as prioridades táticas do combate!" });
  return embed;
}

export function createBattleResultEmbed(username: string, stageName: string, battleResult: any, rewards: any, drops: any[]) {
  const isVictory = battleResult.phase === "VICTORY";
  const statusTitle = isVictory ? "🏆 VICTÓRIA!" : battleResult.phase === "DEFEAT" ? "☠️ DERROTA!" : "🤝 EMPATE!";
  const color = isVictory ? 0x2ecc71 : 0xe74c3c;

  const embed = new EmbedBuilder()
    .setTitle(`${statusTitle} • Batalha em ${stageName}`)
    .setColor(color)
    .setDescription(`**Jogador:** ${username}\n**Rodadas Totais:** ${battleResult.round}\n**Ações Calculadas:** ${battleResult.actions?.length ?? 0}`);

  let rewardsStr = `• **Gold:** +${rewards.gold}\n• **XP:** +${rewards.xp}`;
  if (drops && drops.length > 0) {
    for (const drop of drops) {
      rewardsStr += `\n• **Item Drop:** +${drop.quantity} ${drop.itemKey}`;
    }
  }
  embed.addFields({ name: "🎁 Recompensas Obtidas", value: rewardsStr });

  if (battleResult.actions && battleResult.actions.length > 0) {
    const lastActions = battleResult.actions.slice(-6);
    let logStr = "";
    for (const act of lastActions) {
      const critStr = act.critical ? "💥 **CRÍTICO!**" : "";
      logStr += `• R${act.round} | **${act.actorId.slice(0, 8)}** → *${act.type}* (${act.amount} dano/cura) ${critStr}\n`;
    }
    embed.addFields({ name: "📜 Log dos Últimos Turnos", value: logStr || "Nenhum log registrado." });
  }

  return embed;
}

export function createInventoryEmbed(username: string, inventoryData: any) {
  const embed = new EmbedBuilder()
    .setTitle(`🎒 Inventário de ${username}`)
    .setColor(0x9b59b6);

  if (!inventoryData) {
    embed.setDescription("Inventário não encontrado.");
    return embed;
  }

  const { currencies, items } = inventoryData;
  embed.addFields({
    name: "💰 Recursos & Moedas",
    value: `• **Gold:** ${currencies.gold}\n• **Gemas:** ${currencies.gems}\n• **Tickets:** ${currencies.tickets}`,
  });

  if (items && items.length > 0) {
    let itemStr = "";
    for (const item of items) {
      itemStr += `• **${item.itemKey}:** ${item.quantity}\n`;
    }
    embed.addFields({ name: "📦 Itens Especiais", value: itemStr });
  } else {
    embed.addFields({ name: "📦 Itens Especiais", value: "Nenhum item no inventário." });
  }

  return embed;
}

export function createLeaderboardEmbed(leaderboard: any[], category: string) {
  const embed = new EmbedBuilder()
    .setTitle(`🏆 Ranking Global (${category.toUpperCase()})`)
    .setColor(0xf1c40f)
    .setDescription("Os melhores jogadores do Anime RPG:");

  if (!leaderboard.length) {
    embed.addFields({ name: "Ranking Vazio", value: "Nenhum jogador classificado ainda." });
    return embed;
  }

  let text = "";
  for (let i = 0; i < leaderboard.length; i += 1) {
    const entry = leaderboard[i];
    const val = category === "gold" ? entry.gold : category === "gems" ? entry.gems : entry.tickets;
    text += `**#${i + 1}** ${entry.username} — **${val}** ${category}\n`;
  }

  embed.setDescription(text);
  return embed;
}
