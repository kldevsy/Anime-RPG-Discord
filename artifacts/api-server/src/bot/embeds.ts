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

export function createProfileEmbed(user: any, collectionCount: number, teamCount: number) {
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
    : DEFAULT_EMBED_IMAGE_URL;

  return new EmbedBuilder()
    .setTitle(`👤 Perfil de ${user.username}`)
    .setColor(0x3498db)
    .setThumbnail(avatarUrl)
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
