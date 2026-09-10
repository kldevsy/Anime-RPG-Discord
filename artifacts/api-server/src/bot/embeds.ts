import { EmbedBuilder } from "discord.js";
import type { CharacterUltimate } from "@workspace/db";
import type { BattleAction, BattleSnapshot, Combatant } from "../battle/BattleState";

/** A Discord-hosted image that is available when a character has no usable artwork. */
export const DEFAULT_EMBED_IMAGE_URL = "https://cdn.discordapp.com/embed/avatars/0.png";

/**
 * Sets an embed image only from an absolute HTTP(S) URL, falling back to a
 * Discord-hosted image so embeds always have media that Discord can proxy.
 */
export function applyEmbedImage(embed: EmbedBuilder, imageUrl: unknown): EmbedBuilder {
  if (typeof imageUrl === "string" && imageUrl.trim().length > 0) {
    const cleanUrl = imageUrl.trim();
    try {
      const { protocol } = new URL(cleanUrl);
      if (protocol === "http:" || protocol === "https:") {
        return embed.setImage(cleanUrl).setThumbnail(cleanUrl);
      }
    } catch {
      // Use the default image below when the supplied URL cannot be parsed.
    }
  }

  return embed.setImage(DEFAULT_EMBED_IMAGE_URL).setThumbnail(DEFAULT_EMBED_IMAGE_URL);
}

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

const RARITY_PRIORITY: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

const DISCORD_FIELD_VALUE_LIMIT = 1024;
const DISCORD_FIELD_NAME_LIMIT = 256;

type CharacterWithUltimate = {
  name?: string;
  anime?: string;
  rarity?: string;
  role?: string;
  ultimate?: CharacterUltimate | null;
};

type SummonedCharacter = CharacterWithUltimate & {
  characterId?: string;
  ownedId?: string;
  imageUrl?: string | null;
};

type TeamMember = {
  position: number;
  ownedId: string;
  level: number;
  character: CharacterWithUltimate;
};

function truncateDiscordText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

/** Formats ultimate information consistently for summon, team, and character-detail embeds. */
export function formatUltimateSummary(ultimate: CharacterUltimate | null | undefined, descriptionLimit = 180): string {
  if (!ultimate) return "✨ **Ultimate:** não disponível.";

  const name = truncateDiscordText(ultimate.name, 120);
  const description = truncateDiscordText(ultimate.description, descriptionLimit);
  return `✨ **${name}** — ${description}`;
}

export function createProfileEmbed(user: any, collectionCount: number, teamCount: number, collection?: any[], teamMembers?: any[]) {
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
    : DEFAULT_EMBED_IMAGE_URL;

  // Cor baseada na raridade mais alta da coleção
  const rarityColors: Record<string, number> = {
    mythic: 0xFF4500,
    legendary: 0xF1C40F,
    epic: 0x9B59B6,
    rare: 0x3498DB,
    uncommon: 0x2ECC71,
    common: 0x95A5A6,
  };

  let embedColor = 0x3498DB;
  if (collection && collection.length > 0) {
    const rarityOrder = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];
    for (const rarity of rarityOrder) {
      if (collection.some((c: any) => c.character?.rarity === rarity)) {
        embedColor = rarityColors[rarity];
        break;
      }
    }
  }

  // Contagem por raridade
  const rarityCounts: Record<string, number> = {};
  if (collection) {
    for (const item of collection) {
      const rarity = item.character?.rarity ?? "common";
      rarityCounts[rarity] = (rarityCounts[rarity] ?? 0) + 1;
    }
  }

  const rarityEmojis: Record<string, string> = {
    mythic: "🔴",
    legendary: "🟡",
    epic: "🟣",
    rare: "🔵",
    uncommon: "🟢",
    common: "⚪",
  };

  const rarityLine = ["mythic", "legendary", "epic", "rare", "uncommon", "common"]
    .filter(r => rarityCounts[r])
    .map(r => `${rarityEmojis[r]} ${rarityCounts[r]}`)
    .join("  ") || "Nenhum personagem";

  // Calcular poder total da coleção
  const totalPower = collection?.reduce((sum: number, c: any) => {
    const char = c.character;
    if (!char) return sum;
    return sum + (char.baseHp ?? 0) + (char.baseAttack ?? 0) * 2 + (char.baseDefense ?? 0);
  }, 0) ?? 0;

  // Top 3 personagens mais fortes
  const top3 = collection
    ? [...collection]
        .sort((a: any, b: any) => {
          const powerA = (a.character?.baseAttack ?? 0) * 2 + (a.character?.baseHp ?? 0);
          const powerB = (b.character?.baseAttack ?? 0) * 2 + (b.character?.baseHp ?? 0);
          return powerB - powerA;
        })
        .slice(0, 3)
    : [];

  const top3Text = top3.length > 0
    ? top3.map((c: any, i: number) => {
        const medals = ["🥇", "🥈", "🥉"];
        const rarity = c.character?.rarity ?? "common";
        return `${medals[i]} **${c.character?.name ?? "?"}** ${rarityEmojis[rarity] ?? ""}  Nv.${c.level ?? 1}`;
      }).join("\n")
    : "Nenhum personagem ainda";

  // Equipe atual
  const teamText = teamMembers && teamMembers.length > 0
    ? teamMembers.map((m: any) => {
        const name = m.character?.name ?? m.name ?? "?";
        const rarity = m.character?.rarity ?? "common";
        return `${rarityEmojis[rarity] ?? "▪️"} **${name}**`;
      }).join("\n")
    : "Equipe vazia — use `/equipe` para montar!";

  // Recursos formatados
  const goldStr = (user.gold ?? 0).toLocaleString("pt-BR");
  const gemsStr = (user.gems ?? 0).toLocaleString("pt-BR");
  const ticketsStr = (user.tickets ?? 0).toLocaleString("pt-BR");

  const embed = new EmbedBuilder()
    .setTitle(`✨ ${user.username}`)
    .setColor(embedColor)
    .setThumbnail(avatarUrl)
    .setDescription(
      `🆔 \`${user.discordId}\`\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .addFields(
      {
        name: "💰 Recursos",
        value:
          `🪙 Gold: **${goldStr}**\n` +
          `💎 Gemas: **${gemsStr}**\n` +
          `🎟️ Tickets: **${ticketsStr}**`,
        inline: true,
      },
      {
        name: "📊 Coleção",
        value:
          `🎴 Total: **${collectionCount}** personagens\n` +
          `⚔️ Equipe: **${teamCount}/5** slots\n` +
          `⚡ Poder: **${totalPower.toLocaleString("pt-BR")}**`,
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: "🏆 Raridades na Coleção",
        value: rarityLine,
        inline: false,
      },
      {
        name: "🌟 Top 3 Personagens",
        value: top3Text,
        inline: true,
      },
      {
        name: "⚔️ Equipe Atual",
        value: teamText,
        inline: true,
      }
    )
    .setFooter({ text: "Anime RPG • Use /personagens para ver sua coleção completa" })
    .setTimestamp();

  return embed;
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

export function createSummonResultEmbed(username: string, results: SummonedCharacter[], currency: string, cost: number) {
  const embed = new EmbedBuilder()
    .setTitle(`🌟 Resultado da Invocação de ${username}`)
    .setColor(0xf1c40f)
    .setDescription(`Você gastou **${cost} ${currency}** e invocou **${results.length}** personagem(ns)!`);

  for (let i = 0; i < results.length; i += 1) {
    const r = results[i];
    const rarityLabel = RARITY_NAMES[r.rarity ?? ""] || r.rarity || "Desconhecida";
    const characterName = r.name || "Personagem desconhecido";
    const anime = r.anime || "Anime desconhecido";
    const teamId = r.ownedId ?? r.characterId;
    const teamIdText = teamId ? `\n• **ID para equipe:** \`${teamId}\`` : "";
    const fieldName = truncateDiscordText(`🎴 ${i + 1}. [${anime}] ${characterName} • ${rarityLabel.toUpperCase()}`, DISCORD_FIELD_NAME_LIMIT);
    const fieldValue = truncateDiscordText(formatUltimateSummary(r.ultimate, 700) + teamIdText, DISCORD_FIELD_VALUE_LIMIT);
    embed.addFields({ name: fieldName, value: fieldValue });
  }

  if (!results.length) embed.addFields({ name: "🎴 Personagens Obtidos", value: "Nenhum resultado." });

  // Discord supports one primary embed image. Select the highest-rarity result;
  // when rarities tie, keep the first result so 10x summons remain deterministic.
  const featuredResult = results.reduce<SummonedCharacter | undefined>((current, result) => {
    if (!current || (RARITY_PRIORITY[result.rarity ?? ""] ?? -1) > (RARITY_PRIORITY[current.rarity ?? ""] ?? -1)) {
      return result;
    }
    return current;
  }, undefined);
  applyEmbedImage(embed, featuredResult?.imageUrl);

  return embed;
}

/**
 * Discord only supports one primary image per embed. A 10x summon therefore
 * gets one embed per character, so every result can display its own artwork.
 */
export function createSummonResultEmbeds(username: string, results: SummonedCharacter[], currency: string, cost: number) {
  if (!results.length) return [createSummonResultEmbed(username, results, currency, cost)];

  return results.slice(0, 10).map((result, index) => {
    const rarityLabel = RARITY_NAMES[result.rarity ?? ""] || result.rarity || "Desconhecida";
    const teamId = result.ownedId ?? result.characterId;
    const teamIdText = teamId ? `\n• **ID para equipe:** \`${teamId}\`` : "";
    
    // Informação de maestria (duplicata)
    let masteryText = "";
    if (result.isDuplicate && result.masteryGained) {
      const { xpGained, oldLevel, newLevel, levelsGained } = result.masteryGained;
      
      if (levelsGained > 0) {
        masteryText = `\n\n⭐ **DUPLICATA!** ⭐\n🎯 Maestria: Nível ${oldLevel} → **${newLevel}**\n💫 +${xpGained} XP de Maestria`;
      } else {
        masteryText = `\n\n⭐ **DUPLICATA!**\n💫 +${xpGained} XP de Maestria`;
      }
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`🌟 Invocação ${index + 1}/${results.length} • ${result.name ?? "Personagem"}`)
      .setColor(result.isDuplicate ? 0x9b59b6 : (RARITY_COLORS[result.rarity ?? ""] ?? 0xf1c40f))
      .setDescription(
        index === 0
          ? `**${username}**, você gastou **${cost} ${currency}**.\n[${result.anime ?? "Anime desconhecido"}] • **${rarityLabel}**${masteryText}`
          : `[${result.anime ?? "Anime desconhecido"}] • **${rarityLabel}**${masteryText}`,
      )
      .addFields({
        name: "✨ Ultimate",
        value: truncateDiscordText(formatUltimateSummary(result.ultimate, 700) + teamIdText, DISCORD_FIELD_VALUE_LIMIT),
      })
      .setFooter({ text: `Resultado ${index + 1} de ${results.length} • Anime RPG` });
    applyEmbedImage(embed, result.imageUrl);
    return embed;
  });
}

export function createTeamEmbed(username: string, team: unknown, members: TeamMember[]) {
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
    const rarityLabel = RARITY_NAMES[char.rarity ?? ""] || char.rarity || "Desconhecida";
    const role = char.role?.toUpperCase() ?? "SEM FUNÇÃO";
    text += `**Posição ${m.position}:** [${char.anime ?? "Anime desconhecido"}] **${char.name ?? "Personagem desconhecido"}** (Nível ${m.level}) • *${role}* • ${rarityLabel}\n• **ID de Propriedade:** \`${m.ownedId}\`\n• ${formatUltimateSummary(char.ultimate, 300)}\n\n`;
  }

  embed.setDescription(truncateDiscordText(text, 4096));
  embed.setFooter({ text: "Dica: A posição do personagem altera as prioridades táticas do combate!" });
  return embed;
}

function hpBar(unit: Combatant): string {
  const ratio = unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
  const filled = Math.round(ratio * 10);
  return `${"🟩".repeat(filled)}${"⬛".repeat(10 - filled)} ${unit.hp}/${unit.maxHp}`;
}

function unitLine(unit: Combatant): string {
  const state = unit.alive ? "" : " • **DERROTADO**";
  const phase = unit.isBoss && unit.currentPhase && unit.maxPhases ? ` • Fase ${unit.currentPhase}/${unit.maxPhases}` : "";
  return `**${unit.name}**${phase}${state}\n❤️ ${hpBar(unit)}\n🛡️ ${unit.statusEffects.length ? unit.statusEffects.map((s) => s.type).join(", ") : "nenhum"}`;
}

function ultimateLine(unit: Combatant): string {
  const required = Math.max(1, unit.ultimateChargeRequired);
  const filled = Math.round(Math.min(1, unit.ultimateCharge / required) * 8);
  const ready = unit.ultimateReady ? " • **PRONTO**" : "";
  const skill = unit.skills.ultimate;
  const effects = skill.statusEffects?.map((effect) => effect.type).join(", ") ?? "dano/cura direto";
  const policy = skill.chargePolicy;
  const triggers = [policy.onTurnStart && `turno +${policy.onTurnStart}`, policy.onBasicHit && `básico +${policy.onBasicHit}`, policy.onDamageDealt && `dano +${policy.onDamageDealt}`, policy.onDamageReceived && `receber +${policy.onDamageReceived}`, policy.onCriticalHit && `crítico +${policy.onCriticalHit}`, policy.onDefeat && `abate +${policy.onDefeat}`].filter(Boolean).join(" • ") || "gatilho próprio não configurado";
  return `✨ **${unit.name} — ${skill.name}**\n${"🟪".repeat(filled)}${"⬛".repeat(8 - filled)} ${unit.ultimateCharge}/${required}${ready}\n${skill.type} (${skill.targetType}) • ${effects}\n*Recarga: ${triggers}. Carga só é gasta ao usar a ultimate.*`;
}

function actionLine(action: BattleAction): string {
  if (action.type === "ultimate") {
    const target = action.targetName ? ` → **${action.targetName}**` : "";
    const amount = action.amount ? ` • **${action.isHealing ? "+" : "-"}${action.amount} ${action.isHealing ? "HP" : "dano"}**` : "";
    return `✨ **ULTIMATE: ${action.actorName} — ${action.skillName ?? action.ultimateKey ?? "Técnica"}**${target}${amount}${action.critical ? " • 💥 **CRÍTICO**" : ""}`;
  }
  if (action.type === "ultimate_ready") return `✨ **${action.actorName}: ULTIMATE PRONTA** (${action.finalCharge})`;
  if (action.type === "ultimate_charge") return `🔋 ${action.actorName}: ${action.previousCharge} +${action.chargeDelta} → ${action.finalCharge}`;
  if (action.type === "status_applied") return `✳️ **${action.targetName ?? action.actorName}** recebeu **${action.statusType}**`;
  const target = action.targetName ? ` → **${action.targetName}**` : "";
  const amount = action.amount ? ` • ${action.type === "heal" ? "+" : "-"}${action.amount}` : "";
  const critical = action.critical ? " • 💥 **CRÍTICO**" : "";
  const skill = action.skillName ? ` *${action.skillName}*` : "";
  return `• R${action.round} **${action.actorName}**${target}${skill}${amount}${critical}`;
}

function battleStatus(snapshot: BattleSnapshot): { title: string; color: number } {
  if (snapshot.phase === "VICTORY") return { title: "🏆 VITÓRIA", color: 0x2ecc71 };
  if (snapshot.phase === "DEFEAT") return { title: "☠️ DERROTA", color: 0xe74c3c };
  if (snapshot.phase === "DRAW") return { title: "🤝 EMPATE", color: 0xf1c40f };
  return { title: "⚔️ COMBATE AUTOMÁTICO", color: 0x3498db };
}

export function createBattleProgressEmbed(username: string, stageName: string, snapshot: BattleSnapshot) {
  const status = battleStatus(snapshot);
  const latestAction = snapshot.actions.at(-1);
  const actionText = latestAction ? actionLine(latestAction) : "Os combatentes estão se preparando...";
  const playerText = snapshot.playerTeam.map(unitLine).join("\n\n") || "Nenhum combatente";
  const ultimateText = snapshot.playerTeam.map(ultimateLine).join("\n\n") || "Nenhuma ultimate disponível";
  const enemyText = snapshot.enemyTeam.map(unitLine).join("\n\n") || "Nenhum inimigo";
  const initiative = snapshot.initiative.length ? snapshot.initiative.join(" → ") : "Calculando iniciativa...";
  const recentActions = snapshot.actions.slice(-5).map(actionLine).join("\n") || "Aguardando o primeiro turno...";

  return new EmbedBuilder()
    .setTitle(`${status.title} • ${stageName}`)
    .setColor(status.color)
    .setDescription(`**Jogador:** ${username}\n**Rodada:** ${snapshot.round || 1} • **Ação:** ${snapshot.actions.length}\n\n${actionText}`)
    .addFields(
      { name: "🧑‍🤝‍🧑 Jogador", value: playerText, inline: true },
      { name: "👹 NPCs", value: enemyText, inline: true },
      { name: "✨ Ultimates e regras de recarga", value: ultimateText },
      { name: "🎲 Iniciativa", value: initiative },
      { name: "📜 Últimas ações", value: recentActions }
    )
    .setFooter({ text: snapshot.phase === "VICTORY" || snapshot.phase === "DEFEAT" || snapshot.phase === "DRAW" ? "Batalha encerrada • resultado salvo no servidor" : "Turnos automáticos • atualizando em tempo real" })
    .setTimestamp();
}

export function createBattleResultEmbed(username: string, stageName: string, battleResult: BattleSnapshot, rewards: any, drops: any[]) {
  const embed = createBattleProgressEmbed(username, stageName, battleResult);
  let rewardsStr = `• **Gold:** +${rewards.gold}\n• **XP:** +${rewards.xp}`;
  if (drops && drops.length > 0) {
    for (const drop of drops) rewardsStr += `\n• **Item Drop:** +${drop.quantity} ${drop.itemKey}`;
  }
  embed.addFields({ name: "🎁 Recompensas acumuladas", value: rewardsStr });
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


/**
 * Cria embed de vitória para batalha PvP adaptativa
 */
export function createAdaptivePvpVictoryEmbed(
  username: string,
  enemyTeamName: string,
  difficulty: string,
  rewards: { gold: number; gems: number; xp: number },
  result: BattleSnapshot
): EmbedBuilder {
  const difficultyEmojis: Record<string, string> = {
    easy: "🟢",
    normal: "🟡",
    hard: "🔴",
    nightmare: "⚫"
  };
  
  const difficultyNames: Record<string, string> = {
    easy: "Fácil",
    normal: "Normal",
    hard: "Difícil",
    nightmare: "Pesadelo"
  };
  
  const embed = new EmbedBuilder()
    .setTitle("🏆 VITÓRIA ÉPICA!")
    .setColor(0x00FF00)
    .setDescription(
      `**${username}** derrotou **${enemyTeamName}**!\n\n` +
      `${difficultyEmojis[difficulty]} **Dificuldade:** ${difficultyNames[difficulty]}\n` +
      `⚔️ **Rodadas:** ${result.round}/${result.maxRounds}\n` +
      `💀 **Derrotados:** ${result.enemies.filter(e => !e.alive).length}/${result.enemies.length}\n\n` +
      `**🎁 RECOMPENSAS CONQUISTADAS:**\n` +
      `💰 **${rewards.gold} Gold**\n` +
      `💎 **${rewards.gems} Gemas**\n` +
      `⭐ **${rewards.xp} XP**`
    )
    .setFooter({ text: `🎮 Batalha PvP Adaptativa • Continue lutando para maiores recompensas!` })
    .setTimestamp();
  
  // Adiciona informações do time sobrevivente
  const survivors = result.allies.filter(a => a.alive);
  if (survivors.length > 0) {
    const survivorInfo = survivors.map(s => {
      const hpPercent = Math.round((s.hp / s.maxHp) * 100);
      const hpBar = hpPercent > 75 ? "🟢" : hpPercent > 40 ? "🟡" : hpPercent > 15 ? "🟠" : "🔴";
      return `${hpBar} **${s.name}** - ${s.hp}/${s.maxHp} HP (${hpPercent}%)`;
    }).join("\n");
    
    embed.addFields({
      name: `✅ Sobreviventes (${survivors.length}/${result.allies.length})`,
      value: survivorInfo
    });
  }
  
  return embed;
}

/**
 * Cria embed de derrota para batalha PvP adaptativa
 */
export function createAdaptivePvpDefeatEmbed(
  username: string,
  enemyTeamName: string,
  difficulty: string,
  rewards: { gold: number; gems: number; xp: number },
  result: BattleSnapshot
): EmbedBuilder {
  const difficultyEmojis: Record<string, string> = {
    easy: "🟢",
    normal: "🟡",
    hard: "🔴",
    nightmare: "⚫"
  };
  
  const difficultyNames: Record<string, string> = {
    easy: "Fácil",
    normal: "Normal",
    hard: "Difícil",
    nightmare: "Pesadelo"
  };
  
  const embed = new EmbedBuilder()
    .setTitle("💀 DERROTA...")
    .setColor(0xFF0000)
    .setDescription(
      `**${username}** foi derrotado por **${enemyTeamName}**.\n\n` +
      `${difficultyEmojis[difficulty]} **Dificuldade:** ${difficultyNames[difficulty]}\n` +
      `⚔️ **Rodadas sobrevividas:** ${result.round}/${result.maxRounds}\n` +
      `⚰️ **Inimigos eliminados:** ${result.enemies.filter(e => !e.alive).length}/${result.enemies.length}\n\n` +
      `❗ **Não desista! Treine e tente novamente.**\n\n` +
      `**💰 Recompensas de Consolação:**\n` +
      `💰 **${rewards.gold} Gold** (30% do normal)\n` +
      `💎 **${rewards.gems} Gemas** (30% do normal)\n` +
      `⭐ **${rewards.xp} XP** (30% do normal)`
    )
    .setFooter({ text: `🎮 Batalha PvP Adaptativa • Melhore sua equipe e retorne mais forte!` })
    .setTimestamp();
  
  // Mostra inimigos sobreviventes (os que te derrotaram)
  const enemySurvivors = result.enemyTeam.filter(e => e.alive);
  if (enemySurvivors.length > 0) {
    const enemyInfo = enemySurvivors.map(e => {
      const hpPercent = Math.round((e.hp / e.maxHp) * 100);
      return `⚔️ **${e.name}** - ${hpPercent}% HP restante`;
    }).join("\n");
    
    embed.addFields({
      name: `👹 Inimigos Sobreviventes (${enemySurvivors.length}/${result.enemyTeam.length})`,
      value: enemyInfo
    });
  }
  
  // Dicas baseadas na dificuldade
  const tips: Record<string, string> = {
    easy: "💡 **Dica:** Invoque mais personagens e fortaleça sua equipe!",
    normal: "💡 **Dica:** Aprimore seus personagens e considere mudar a formação do time.",
    hard: "💡 **Dica:** Foque em maestria e composição de equipe balanceada (DPS + Tank + Support).",
    nightmare: "💡 **Dica:** Somente os melhores sobrevivem. Maestria máxima e personagens META são essenciais!"
  };
  
  embed.addFields({
    name: "📚 Sugestão",
    value: tips[difficulty]
  });
  
  return embed;
}

/**
 * Cria embed de progresso da batalha PvP (sem mostrar barras de ultimate dos inimigos)
 */
export function createAdaptivePvpProgressEmbed(
  username: string,
  enemyTeamName: string,
  difficulty: string,
  snapshot: BattleSnapshot,
  lastAction?: BattleAction
): EmbedBuilder {
  const difficultyEmojis: Record<string, string> = {
    easy: "🟢",
    normal: "🟡",
    hard: "🔴",
    nightmare: "⚫"
  };
  
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${username} vs ${enemyTeamName}`)
    .setColor(0x3498DB)
    .setDescription(
      `${difficultyEmojis[difficulty]} **Dificuldade:** ${difficulty.toUpperCase()}\n` +
      `📊 **Rodada ${snapshot.round}/${snapshot.maxRounds}**`
    );
  
  // Seu time (mostra ultimate charge)
  const allyLines = snapshot.playerTeam.map((ally) => {
    if (!ally.alive) return `💀 ~~${ally.name}~~`;
    
    const hpPercent = Math.round((ally.hp / ally.maxHp) * 100);
    const hpBar = hpPercent > 75 ? "🟢" : hpPercent > 40 ? "🟡" : hpPercent > 15 ? "🟠" : "🔴";
    
    const ultCharge = ally.energy;
    const ultRequired = ally.skills.ultimate.chargeRequired;
    const ultPercent = Math.min(100, Math.round((ultCharge / ultRequired) * 100));
    const ultReady = ultCharge >= ultRequired ? "✨ PRONTA!" : `${ultPercent}%`;
    
    return `${hpBar} **${ally.name}** | HP: ${ally.hp}/${ally.maxHp} | Ult: ${ultReady}`;
  });
  
  embed.addFields({
    name: `👥 Seu Time (${snapshot.playerTeam.filter(a => a.alive).length}/${snapshot.playerTeam.length} vivos)`,
    value: allyLines.join("\n") || "Nenhum"
  });
  
  // Time inimigo (NÃO mostra ultimate charge)
  const enemyLines = snapshot.enemyTeam.map((enemy) => {
    if (!enemy.alive) return `💀 ~~${enemy.name}~~`;
    
    const hpPercent = Math.round((enemy.hp / enemy.maxHp) * 100);
    const hpBar = hpPercent > 75 ? "🟢" : hpPercent > 40 ? "🟡" : hpPercent > 15 ? "🟠" : "🔴";
    
    return `${hpBar} **${enemy.name}** | HP: ${enemy.hp}/${enemy.maxHp}`;
  });
  
  embed.addFields({
    name: `👹 ${enemyTeamName} (${snapshot.enemyTeam.filter(e => e.alive).length}/${snapshot.enemyTeam.length} vivos)`,
    value: enemyLines.join("\n") || "Nenhum"
  });
  
  // Última ação
  if (lastAction) {
    let actionText = "";
    
    if (lastAction.type === "BASIC_ATTACK") {
      const critText = lastAction.isCrit ? " **CRÍTICO!**" : "";
      actionText = `⚔️ **${lastAction.actorName}** atacou **${lastAction.targetName}** causando **${lastAction.damage}** de dano${critText}`;
    } else if (lastAction.type === "ULTIMATE") {
      actionText = `✨ **${lastAction.actorName}** usou **${lastAction.skillName}**! Dano: **${lastAction.damage}**`;
    } else if (lastAction.type === "HEAL") {
      actionText = `💚 **${lastAction.actorName}** curou **${lastAction.targetName}** em **${lastAction.healAmount}** HP`;
    } else if (lastAction.type === "STATUS_APPLIED") {
      actionText = `🎯 **${lastAction.statusType?.toUpperCase()}** aplicado em **${lastAction.targetName}**`;
    } else if (lastAction.type === "DEATH") {
      actionText = `💀 **${lastAction.actorName}** foi derrotado!`;
    }
    
    if (actionText) {
      embed.addFields({
        name: "📝 Última Ação",
        value: actionText
      });
    }
  }
  
  return embed;
}

// ==========================================
// 🎯 EQUIPMENT EMBEDS
// ==========================================

import type { Equipment, UserEquipment } from "@workspace/db/schema";

/**
 * Formata bonus de stats de equipamento
 */
export function formatEquipmentBonuses(equip: Equipment): string {
  const bonuses: string[] = [];
  
  if (equip.bonusHp > 0) bonuses.push(`+${equip.bonusHp} HP`);
  if (equip.bonusAttack > 0) bonuses.push(`+${equip.bonusAttack} ATK`);
  if (equip.bonusDefense > 0) bonuses.push(`+${equip.bonusDefense} DEF`);
  if (equip.bonusSpeed > 0) bonuses.push(`+${equip.bonusSpeed} SPD`);
  if (equip.bonusCritChance > 0) bonuses.push(`+${equip.bonusCritChance}% CRIT`);
  if (equip.bonusCritDamage > 0) bonuses.push(`+${equip.bonusCritDamage}% CRIT DMG`);
  
  return bonuses.length > 0 ? bonuses.join(", ") : "Nenhum bonus";
}

/**
 * Retorna texto de equipável
 */
export function getEquipableText(equip: Equipment): string {
  switch (equip.equipableType) {
    case "character":
      return `⭐ ${equip.equipableTarget}`;
    case "role":
      return `🎯 ${equip.equipableTarget?.toUpperCase()}`;
    case "universal":
      return "🌟 Universal (Todos)";
    default:
      return "❓ Desconhecido";
  }
}

/**
 * Embed de detalhes de equipamento
 */
export function createEquipmentDetailsEmbed(equip: Equipment): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${equip.name}`)
    .setColor(RARITY_COLORS[equip.rarity] || 0x95a5a6)
    .setDescription(equip.description || "Sem descrição");

  // Raridade e Equipável
  embed.addFields(
    {
      name: "📊 Informações",
      value: `**Raridade:** ${RARITY_NAMES[equip.rarity] || equip.rarity}\n**Equipável:** ${getEquipableText(equip)}`,
      inline: true
    },
    {
      name: "⚡ Bonus de Stats",
      value: formatEquipmentBonuses(equip),
      inline: false
    }
  );

  // Passiva (se tiver)
  if (equip.passiveAbility) {
    const passive = equip.passiveAbility as any;
    embed.addFields({
      name: `🔮 Passiva: ${passive.name || "Sem nome"}`,
      value: passive.description || "Sem descrição",
      inline: false
    });
  } else {
    embed.addFields({
      name: "🔮 Passiva",
      value: "*Este equipamento não possui passiva*",
      inline: false
    });
  }

  if (equip.imageUrl) {
    applyEmbedImage(embed, equip.imageUrl);
  }

  return embed;
}

/**
 * Embed de inventário de equipamentos
 */
export function createEquipmentInventoryEmbed(
  userEquipments: Array<UserEquipment & { equipment: Equipment }>,
  filter: "all" | "equipped" | "available" = "all"
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("🎒 Inventário de Equipamentos")
    .setColor(0x3498db);

  if (userEquipments.length === 0) {
    embed.setDescription("❌ Você não possui nenhum equipamento ainda!");
    return embed;
  }

  // Agrupa por raridade
  const grouped: Record<string, typeof userEquipments> = {};
  
  for (const item of userEquipments) {
    const rarity = item.equipment.rarity;
    if (!grouped[rarity]) grouped[rarity] = [];
    grouped[rarity].push(item);
  }

  // Ordena por raridade (mítico -> comum)
  const sortedRarities = Object.keys(grouped).sort((a, b) => {
    return (RARITY_PRIORITY[b] || 0) - (RARITY_PRIORITY[a] || 0);
  });

  let description = `**Total:** ${userEquipments.length} equipamento(s)\n\n`;

  for (const rarity of sortedRarities) {
    const items = grouped[rarity];
    description += `**${RARITY_NAMES[rarity] || rarity}** (${items.length}):\n`;
    
    for (const item of items.slice(0, 5)) { // Max 5 por raridade
      const equip = item.equipment;
      const bonuses = formatEquipmentBonuses(equip);
      description += `• **${equip.name}** - ${bonuses}\n`;
      description += `  └─ Equipável: ${getEquipableText(equip)}\n`;
    }
    
    if (items.length > 5) {
      description += `  *...e mais ${items.length - 5} equipamento(s)*\n`;
    }
    
    description += "\n";
  }

  embed.setDescription(description);
  embed.setFooter({ text: "Use /equipamento equipar para equipar um item" });

  return embed;
}

/**
 * Embed de catálogo de equipamentos
 */
export function createEquipmentCatalogEmbed(
  equipments: Equipment[],
  page: number = 1,
  pageSize: number = 10
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("📚 Catálogo de Equipamentos")
    .setColor(0xe67e22);

  if (equipments.length === 0) {
    embed.setDescription("❌ Nenhum equipamento encontrado com esses filtros!");
    return embed;
  }

  const totalPages = Math.ceil(equipments.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageItems = equipments.slice(startIdx, endIdx);

  let description = `**Total:** ${equipments.length} equipamento(s)\n`;
  description += `**Página:** ${page}/${totalPages}\n\n`;

  for (const equip of pageItems) {
    const rarityName = RARITY_NAMES[equip.rarity] || equip.rarity;
    const bonuses = formatEquipmentBonuses(equip);
    const equipable = getEquipableText(equip);
    const hasPassive = equip.passiveAbility ? "✨" : "";
    
    description += `**[${rarityName}] ${equip.name}** ${hasPassive}\n`;
    description += `└─ ${bonuses}\n`;
    description += `└─ ${equipable}\n\n`;
  }

  embed.setDescription(description);
  embed.setFooter({ text: "Use /equipamento info <nome> para ver detalhes completos" });

  return embed;
}

/**
 * Embed de equipamento equipado com sucesso
 */
export function createEquipmentEquippedEmbed(
  characterName: string,
  equip: Equipment
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("✅ Equipamento Equipado!")
    .setColor(0x2ecc71)
    .setDescription(
      `**${equip.name}** foi equipado em **${characterName}**!`
    );

  embed.addFields(
    {
      name: "⚡ Bonus de Stats",
      value: formatEquipmentBonuses(equip),
      inline: false
    }
  );

  if (equip.passiveAbility) {
    const passive = equip.passiveAbility as any;
    embed.addFields({
      name: `🔮 Passiva Adicionada`,
      value: `**${passive.name || "Sem nome"}**\n${passive.description || "Sem descrição"}`,
      inline: false
    });
  }

  if (equip.imageUrl) {
    applyEmbedImage(embed, equip.imageUrl);
  }

  return embed;
}

/**
 * Embed de equipamento removido
 */
export function createEquipmentUnequippedEmbed(characterName: string, equipName: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🔓 Equipamento Removido")
    .setColor(0x95a5a6)
    .setDescription(`**${equipName}** foi removido de **${characterName}**.`);
}

// ==========================================
// 🎁 LOOT BOX EMBEDS
// ==========================================

import type { LootBoxReward } from "../services/LootBoxService";

/**
 * Embed da loja de loot boxes
 */
export function createLootBoxShopEmbed(
  userGems: number,
  pityCounters: Record<string, number>,
  canClaimDaily: boolean
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("🎁 Loja de Loot Boxes")
    .setColor(0xFF6B9D)
    .setDescription(
      "**Compre Loot Boxes e ganhe recompensas incríveis!**\n\n" +
      `💎 **Suas Gemas:** ${userGems}\n\n` +
      "📦 **Tipos de Caixas Disponíveis:**"
    );

  // Caixa Básica
  embed.addFields({
    name: "💚 Caixa Básica - 50 💎",
    value: 
      "• 3 recompensas garantidas\n" +
      "• Gold, Tickets, Equipamentos Common/Uncommon\n" +
      "• XP de Maestria (raro)\n" +
      `📊 Pity: ${pityCounters.basic || 0}/10`,
    inline: true
  });

  // Caixa Avançada
  embed.addFields({
    name: "💙 Caixa Avançada - 150 💎",
    value: 
      "• 5 recompensas garantidas\n" +
      "• Gold, Tickets, Equipamentos Uncommon/Rare\n" +
      "• XP de Maestria, Gemas Bônus\n" +
      `📊 Pity: ${pityCounters.advanced || 0}/10`,
    inline: true
  });

  // Caixa Épica
  embed.addFields({
    name: "💜 Caixa Épica - 400 💎",
    value: 
      "• 7 recompensas garantidas\n" +
      "• Gold, Tickets, Equipamentos Rare/Epic\n" +
      "• XP de Maestria, Gemas, Personagens\n" +
      `📊 Pity: ${pityCounters.epic || 0}/10`,
    inline: true
  });

  // Caixa Lendária
  embed.addFields({
    name: "🟡 Caixa Lendária - 1000 💎",
    value: 
      "• 10 recompensas garantidas\n" +
      "• Gold, Equipamentos Epic/Legendary\n" +
      "• XP de Maestria, Personagens Epic+\n" +
      `📊 Pity: ${pityCounters.legendary || 0}/10`,
    inline: true
  });

  // Caixa Mítica
  embed.addFields({
    name: "🔴 Caixa Mítica - 2500 💎",
    value: 
      "• 15 recompensas garantidas\n" +
      "• Gold Alto, Equipamentos Legendary/Mythic\n" +
      "• XP de Maestria Alto, Personagens Legendários\n" +
      `📊 Pity: ${pityCounters.mythic || 0}/10`,
    inline: true
  });

  // Daily Free Box
  if (canClaimDaily) {
    embed.addFields({
      name: "🎁 Caixa Grátis Diária - DISPONÍVEL!",
      value: "• Use `/lootbox diaria` para reivindicar\n• 1 Caixa Básica grátis por dia",
      inline: true
    });
  } else {
    embed.addFields({
      name: "🎁 Caixa Grátis Diária",
      value: "• Já reivindicada hoje\n• Disponível em 24h",
      inline: true
    });
  }

  embed.setFooter({ 
    text: "🎲 Sistema de Pity: A cada 10 caixas sem item raro, próxima é garantida! • 0.1% chance de JACKPOT" 
  });

  return embed;
}

/**
 * Embed de resultado de abertura de loot box
 */
export function createLootBoxOpeningEmbed(
  boxType: string,
  rewards: LootBoxReward[],
  jackpot: boolean,
  pityTriggered: boolean
): EmbedBuilder {
  const boxNames: Record<string, string> = {
    basic: "💚 Caixa Básica",
    advanced: "💙 Caixa Avançada",
    epic: "💜 Caixa Épica",
    legendary: "🟡 Caixa Lendária",
    mythic: "🔴 Caixa Mítica",
  };

  const embed = new EmbedBuilder()
    .setTitle(`${jackpot ? "🎰 JACKPOT! " : ""}${boxNames[boxType] || "Loot Box"}`)
    .setColor(jackpot ? 0xFFD700 : 0xFF6B9D);

  if (jackpot) {
    embed.setDescription(
      "✨ **JACKPOT ATIVADO!** ✨\n" +
      "Todas as recompensas foram DOBRADAS!\n\n" +
      "🎁 **Suas Recompensas:**"
    );
  } else if (pityTriggered) {
    embed.setDescription(
      "🎯 **Sistema de Pity Ativado!**\n" +
      "Recompensa rara garantida!\n\n" +
      "🎁 **Suas Recompensas:**"
    );
  } else {
    embed.setDescription("🎁 **Suas Recompensas:**");
  }

  // Agrupa recompensas por tipo
  const grouped: Record<string, LootBoxReward[]> = {};
  for (const reward of rewards) {
    if (!grouped[reward.type]) grouped[reward.type] = [];
    grouped[reward.type].push(reward);
  }

  // Formata recompensas
  let description = embed.data.description + "\n\n";

  // Gold
  if (grouped.gold) {
    const total = grouped.gold.reduce((sum, r) => sum + (r.amount || 0), 0);
    description += `💰 **${total.toLocaleString()} Gold**\n`;
  }

  // Tickets
  if (grouped.tickets) {
    const total = grouped.tickets.reduce((sum, r) => sum + (r.amount || 0), 0);
    description += `🎟️ **${total} Tickets**\n`;
  }

  // Gems
  if (grouped.gems) {
    const total = grouped.gems.reduce((sum, r) => sum + (r.amount || 0), 0);
    description += `💎 **${total} Gemas Bônus**\n`;
  }

  // Equipamentos
  if (grouped.equipment) {
    description += `\n⚔️ **Equipamentos:**\n`;
    for (const equip of grouped.equipment) {
      const rarityEmoji: Record<string, string> = {
        common: "⚪",
        uncommon: "🟢",
        rare: "🔵",
        epic: "🟣",
        legendary: "🟡",
        mythic: "🔴"
      };
      const emoji = rarityEmoji[equip.equipmentRarity || "common"] || "⚪";
      description += `${emoji} **${equip.equipmentName}** [${equip.equipmentRarity}]\n`;
    }
  }

  // XP de Maestria
  if (grouped.mastery_xp) {
    const total = grouped.mastery_xp.reduce((sum, r) => sum + (r.amount || 0), 0);
    description += `\n✨ **${total} XP de Maestria**\n`;
    description += `└─ Use \`/lootbox aplicar-xp\` para aplicar em um personagem\n`;
  }

  // Personagens
  if (grouped.character) {
    description += `\n🎴 **Personagens:**\n`;
    for (const char of grouped.character) {
      description += `⭐ **${char.characterName}**\n`;
    }
  }

  // Itens Especiais
  if (grouped.special) {
    description += `\n🌟 **Itens Especiais:**\n`;
    for (const special of grouped.special) {
      const specialNames: Record<string, string> = {
        character_fragment: "Fragmento de Personagem",
        xp_potion: "Poção de Experiência",
        luck_talisman: "Talismã de Sorte",
        golden_key: "Chave Dourada"
      };
      const name = specialNames[special.specialItem || ""] || special.specialItem;
      description += `✨ **${name}**\n`;
    }
  }

  embed.setDescription(description);
  
  if (jackpot) {
    embed.setFooter({ text: "🎰 Você teve SORTE MÁXIMA! Parabéns!" });
  } else {
    embed.setFooter({ text: "Use /lootbox historico para ver suas últimas aberturas" });
  }

  return embed;
}

/**
 * Embed de histórico de loot boxes
 */
export function createLootBoxHistoryEmbed(
  openings: any[],
  stats: { totalOpened: number; totalGemsSpent: number; jackpotCount: number }
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("📊 Histórico de Loot Boxes")
    .setColor(0xFF6B9D)
    .setDescription(
      `**Estatísticas Gerais:**\n` +
      `📦 Total Aberto: ${stats.totalOpened} caixas\n` +
      `💎 Gemas Gastas: ${stats.totalGemsSpent.toLocaleString()}\n` +
      `🎰 Jackpots: ${stats.jackpotCount}x\n\n` +
      `**Últimas Aberturas:**`
    );

  if (openings.length === 0) {
    embed.setDescription(embed.data.description + "\n\n*Você ainda não abriu nenhuma loot box!*");
    return embed;
  }

  const boxNames: Record<string, string> = {
    basic: "💚 Básica",
    advanced: "💙 Avançada",
    epic: "💜 Épica",
    legendary: "🟡 Lendária",
    mythic: "🔴 Mítica",
  };

  for (const opening of openings.slice(0, 10)) {
    const boxName = boxNames[opening.boxType] || opening.boxType;
    const rewards = opening.rewards as LootBoxReward[];
    
    // Pega os melhores items
    const bestItems: string[] = [];
    
    for (const reward of rewards) {
      if (reward.type === "equipment" && 
          (reward.equipmentRarity === "epic" || 
           reward.equipmentRarity === "legendary" || 
           reward.equipmentRarity === "mythic")) {
        bestItems.push(`⚔️ ${reward.equipmentName}`);
      } else if (reward.type === "mastery_xp" && (reward.amount || 0) >= 500) {
        bestItems.push(`✨ ${reward.amount} XP`);
      } else if (reward.type === "character") {
        bestItems.push(`🎴 ${reward.characterName}`);
      }
    }
    
    const timeAgo = formatTimeAgo(opening.openedAt);
    const bestItemsText = bestItems.length > 0 ? bestItems.join(", ") : "Recompensas comuns";
    const jackpotText = opening.jackpot ? " 🎰 JACKPOT!" : "";
    
    embed.addFields({
      name: `${boxName} - ${timeAgo}${jackpotText}`,
      value: `└─ ${bestItemsText}`,
      inline: false
    });
  }

  embed.setFooter({ text: "Mostrando últimas 10 aberturas" });

  return embed;
}

/**
 * Formata tempo decorrido
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays}d atrás`;
  if (diffHours > 0) return `${diffHours}h atrás`;
  if (diffMins > 0) return `${diffMins}min atrás`;
  return "Agora mesmo";
}

/**
 * Embed de caixa grátis diária
 */
export function createDailyFreeBoxEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🎁 Caixa Grátis Diária Reivindicada!")
    .setColor(0x2ECC71)
    .setDescription(
      "✅ Você reivindicou sua **Caixa Básica Grátis** de hoje!\n\n" +
      "Abrindo sua caixa..."
    )
    .setFooter({ text: "Volte amanhã para outra caixa grátis!" });
}

// ==========================================
// 🏰 RAID EMBEDS
// ==========================================

import type { RaidMap } from "@workspace/db/data/raid-catalog";

/**
 * Embed: Lista de raids disponíveis
 */
export function createRaidListEmbed(availableRaids: RaidMap[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("🏰 RAIDS DISPONÍVEIS 🏰")
    .setColor(0x9B59B6)
    .setDescription(
      "**Sistema Cooperativo Multiplayer**\n" +
      "Reúna até 4 jogadores para enfrentar desafios épicos!\n\n" +
      "🎯 **Use `/raid criar` para começar!**"
    )
    .setTimestamp();

  if (availableRaids.length === 0) {
    embed.addFields({
      name: "❌ Nenhuma Raid Disponível",
      value: "Você precisa subir de nível para desbloquear raids!",
    });
    return embed;
  }

  for (const raid of availableRaids) {
    const difficulties = raid.availableDifficulties
      .map((d) => (d === "normal" ? "🟢" : d === "hard" ? "🟡" : "🔴"))
      .join(" ");

    embed.addFields({
      name: `${raid.theme === "Místico/Sombrio" ? "🗼" : raid.theme === "Fogo/Demoníaco" ? "🌋" : "☁️"} ${raid.name}`,
      value:
        `**Nível:** ${raid.minLevel}+ | **Power:** ${raid.recommendedPower}+\n` +
        `**Dificuldades:** ${difficulties}\n` +
        `**Tempo:** ${raid.estimatedTime}\n` +
        `*${raid.description.slice(0, 100)}...*`,
      inline: false,
    });
  }

  embed.setFooter({ text: "💎 Recompensas Premium • 👥 1-4 Jogadores" });

  return embed;
}

/**
 * Embed: Sala de espera da raid
 */
export function createRaidRoomEmbed(
  raidMap: RaidMap,
  difficulty: string,
  roomCode: string,
  participants: Array<{ user: any; participant: any }>,
  teamMembers: Array<{ char: any; user: any; member: any }>
): EmbedBuilder {
  const difficultyEmoji = difficulty === "normal" ? "🟢" : difficulty === "hard" ? "🟡" : "🔴";
  const themeEmoji = raidMap.theme === "Místico/Sombrio" ? "🗼" : raidMap.theme === "Fogo/Demoníaco" ? "🌋" : "☁️";

  const embed = new EmbedBuilder()
    .setTitle(`👥 SALA DE RAID 👥`)
    .setColor(difficulty === "normal" ? 0x2ECC71 : difficulty === "hard" ? 0xF39C12 : 0xE74C3C)
    .setDescription(
      `${themeEmoji} **${raidMap.name}** ${difficultyEmoji}\n` +
      `🎯 **Dificuldade:** ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}\n` +
      `🔑 **Código:** \`${roomCode}\`\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    );

  // Participantes
  let playersText = `**Jogadores:** ${participants.length}/4\n\n`;

  for (const { user, participant } of participants) {
    const isLeader = participant.contribution === 0 && participants[0].user.id === user.id;
    const icon = isLeader ? "👑" : "🎮";
    const userChars = teamMembers.filter((m) => m.user.id === user.id);

    playersText += `${icon} **${user.username}** ${isLeader ? "[Líder]" : ""}\n`;

    if (userChars.length > 0) {
      for (const { char, member } of userChars) {
        playersText += `   • ${char.name} Nv.${member.currentHp > 0 ? "✅" : "💀"}\n`;
      }
    } else {
      playersText += `   ⏳ *Escolhendo personagens...*\n`;
    }

    playersText += "\n";
  }

  // Slots vazios
  for (let i = participants.length; i < 4; i++) {
    playersText += `⏳ **Aguardando jogador ${i + 1}...**\n\n`;
  }

  embed.addFields({
    name: "━━━━━━━━━━━━━━━━━━━━━━",
    value: playersText,
    inline: false,
  });

  // Equipe
  const teamText =
    teamMembers.length === 4
      ? "✅ **Equipe completa!** (4/4 personagens)"
      : `⚠️ **Adicione personagens:** ${teamMembers.length}/4\n\n` +
        `💡 *Use os botões abaixo para adicionar seus personagens!*\n` +
        `Cada jogador pode adicionar personagens até completar 4 total.`;

  embed.addFields({
    name: "🎴 Equipe da Raid",
    value: teamText,
    inline: false,
  });

  embed.setFooter({
    text: `⏰ Expira em 15min • Compartilhe o código: ${roomCode}`,
  });
  embed.setTimestamp();

  return embed;
}

/**
 * Embed: Detalhes do mapa de raid
 */
export function createRaidMapDetailsEmbed(raidMap: RaidMap, difficulty: string): EmbedBuilder {
  const difficultyEmoji = difficulty === "normal" ? "🟢" : difficulty === "hard" ? "🟡" : "🔴";
  const themeEmoji = raidMap.theme === "Místico/Sombrio" ? "🗼" : raidMap.theme === "Fogo/Demoníaco" ? "🌋" : "☁️";

  const embed = new EmbedBuilder()
    .setTitle(`${themeEmoji} ${raidMap.name}`)
    .setColor(difficulty === "normal" ? 0x2ECC71 : difficulty === "hard" ? 0xF39C12 : 0xE74C3C)
    .setDescription(
      `${difficultyEmoji} **${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}**\n\n` +
      `${raidMap.description}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    );

  // Informações
  embed.addFields(
    {
      name: "📊 Informações",
      value:
        `**Nível Mínimo:** ${raidMap.minLevel}\n` +
        `**Power Recomendado:** ${raidMap.recommendedPower}\n` +
        `**Tempo Estimado:** ${raidMap.estimatedTime}\n` +
        `**Waves:** ${raidMap.waves.length} + Boss`,
      inline: true,
    },
    {
      name: "👥 Multiplayer",
      value:
        `**Jogadores:** 1-4\n` +
        `**Personagens:** 4 total\n` +
        `**Revives:** 2 max\n` +
        `**Bônus Grupo:** Até +50%`,
      inline: true,
    }
  );

  // Boss
  embed.addFields({
    name: `💀 Boss: ${raidMap.boss.name}`,
    value:
      `*${raidMap.boss.title}*\n\n` +
      `❤️ **HP:** ${raidMap.boss.hp.toLocaleString()}\n` +
      `⚔️ **ATK:** ${raidMap.boss.attack} | 🛡️ **DEF:** ${raidMap.boss.defense} | ⚡ **SPD:** ${raidMap.boss.speed}\n\n` +
      `🔮 **Passiva:** ${raidMap.boss.passive.slice(0, 150)}...\n\n` +
      `✨ **Ultimate:** *${raidMap.boss.ultimate.name}* - ${raidMap.boss.ultimate.description.slice(0, 100)}...`,
    inline: false,
  });

  // Recompensas
  const rewards = raidMap.baseRewards[difficulty as keyof typeof raidMap.baseRewards];
  if (rewards && rewards.gold[0] > 0) {
    embed.addFields({
      name: "🎁 Recompensas Base",
      value:
        `💰 **Gold:** ${rewards.gold[0].toLocaleString()} - ${rewards.gold[1].toLocaleString()}\n` +
        `💎 **Gemas:** ${rewards.gems[0]} - ${rewards.gems[1]}\n` +
        `✨ **XP Maestria:** ${rewards.masteryXp[0]} - ${rewards.masteryXp[1]}\n` +
        `🎟️ **Tickets:** ${rewards.tickets[0]} - ${rewards.tickets[1]}`,
      inline: true,
    });
  }

  // Drops especiais
  if (raidMap.specialDrops.length > 0) {
    const dropsText = raidMap.specialDrops
      .slice(0, 3)
      .map((drop) => `• ${drop.equipmentName} [${drop.rarity}] - ${drop.dropChance}%`)
      .join("\n");

    embed.addFields({
      name: "⚔️ Drops Exclusivos",
      value: dropsText,
      inline: true,
    });
  }

  embed.setFooter({
    text: "💡 Bônus Primeira Clear: 2x-5x recompensas!",
  });

  if (raidMap.imageUrl) {
    embed.setImage(raidMap.imageUrl);
  }

  return embed;
}

/**
 * Embed: Vitória na raid
 */
export function createRaidVictoryEmbed(
  raidMap: RaidMap,
  difficulty: string,
  clearTime: number,
  totalDamage: number,
  deathCount: number,
  rewardsByUser: Record<string, any>,
  participants: Array<{ user: any }>
): EmbedBuilder {
  const difficultyEmoji = difficulty === "normal" ? "🟢" : difficulty === "hard" ? "🟡" : "🔴";
  const themeEmoji = raidMap.theme === "Místico/Sombrio" ? "🗼" : raidMap.theme === "Fogo/Demoníaco" ? "🌋" : "☁️";

  const minutes = Math.floor(clearTime / 60);
  const seconds = clearTime % 60;

  const embed = new EmbedBuilder()
    .setTitle("🎉 RAID CONCLUÍDA COM SUCESSO! 🎉")
    .setColor(0xF1C40F)
    .setDescription(
      `${themeEmoji} **${raidMap.name}** ${difficultyEmoji}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⏱️ **Tempo:** ${minutes}min ${seconds}s\n` +
      `💀 **Mortes:** ${deathCount}\n` +
      `⚔️ **Dano Total:** ${totalDamage.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    );

  // Recompensas por jogador
  for (const { user } of participants) {
    const rewards = rewardsByUser[user.id];
    if (!rewards) continue;

    let rewardText =
      `💰 **${rewards.gold.toLocaleString()}** Gold\n` +
      `💎 **${rewards.gems}** Gemas\n` +
      `✨ **${rewards.masteryXp}** XP Maestria\n` +
      `🎟️ **${rewards.tickets}** Tickets\n`;

    if (rewards.equipment && rewards.equipment.length > 0) {
      rewardText += `\n⚔️ **Equipamentos:**\n`;
      for (const equip of rewards.equipment) {
        rewardText += `   • ${equip.name} [${equip.rarity}] 🎊\n`;
      }
    }

    if (rewards.lootBoxes && rewards.lootBoxes.length > 0) {
      rewardText += `\n📦 **Loot Boxes:**\n`;
      const boxCount: Record<string, number> = {};
      for (const box of rewards.lootBoxes) {
        boxCount[box.type] = (boxCount[box.type] || 0) + 1;
      }
      for (const [type, count] of Object.entries(boxCount)) {
        const boxName = type.charAt(0).toUpperCase() + type.slice(1);
        rewardText += `   • ${count}x ${boxName}\n`;
      }
    }

    embed.addFields({
      name: `🎁 ${user.username}`,
      value: rewardText,
      inline: false,
    });
  }

  embed.setFooter({
    text: `🏆 ${participants.length} jogadores • Use /raid ranking para ver o leaderboard!`,
  });
  embed.setTimestamp();

  return embed;
}

/**
 * Embed: Leaderboard de raid
 */
export function createRaidLeaderboardEmbed(
  raidMap: RaidMap,
  difficulty: string,
  entries: Array<{ entry: any; user: any }>
): EmbedBuilder {
  const difficultyEmoji = difficulty === "normal" ? "🟢" : difficulty === "hard" ? "🟡" : "🔴";
  const themeEmoji = raidMap.theme === "Místico/Sombrio" ? "🗼" : raidMap.theme === "Fogo/Demoníaco" ? "🌋" : "☁️";

  const embed = new EmbedBuilder()
    .setTitle(`🏆 LEADERBOARD - ${raidMap.name}`)
    .setColor(0xF1C40F)
    .setDescription(`${themeEmoji} ${difficultyEmoji} **${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}**\n━━━━━━━━━━━━━━━━━━━━━━`);

  if (entries.length === 0) {
    embed.addFields({
      name: "❌ Nenhum Record",
      value: "Seja o primeiro a completar esta raid!",
    });
    return embed;
  }

  let leaderboardText = "";

  for (let i = 0; i < entries.length; i++) {
    const { entry, user } = entries[i];
    const rank = i + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `**${rank}.**`;

    const minutes = Math.floor(entry.bestTime / 60);
    const seconds = entry.bestTime % 60;

    leaderboardText +=
      `${medal} **${user.username}**\n` +
      `   ⏱️ ${minutes}min ${seconds}s • 🔄 ${entry.totalClears} clears\n\n`;
  }

  embed.addFields({
    name: "🏅 Top Jogadores",
    value: leaderboardText || "Nenhum record ainda!",
    inline: false,
  });

  embed.setFooter({
    text: "⚡ Complete raids para aparecer no ranking!",
  });
  embed.setTimestamp();

  return embed;
}
