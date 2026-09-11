import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import type { CharacterUltimate } from "@workspace/db";
import {
  getOrCreateUser,
  getProfile,
  getTeam,
  listCharacters,
  replaceTeam,
} from "../services/PhaseOneService";
import {
  getSummonHistory,
  getUserInventory,
  listActiveBanners,
  summon,
} from "../services/SummonService";
import { listPlayerBattles, runPlayerBattle } from "../services/BattleService";
import { getPveStageById, listPveStages, listPveWorlds } from "../services/PveService";
import { getTransactionHistory } from "../services/EconomyService";
import { claimQuestReward, getUserQuests, updateQuestProgress } from "../services/QuestService";
import { claimDailyReward, getDailyRewardStatus } from "../services/DailyRewardService";
import {
  getCollectionLeaderboard,
  getPveLeaderboard,
  getTeamPowerLeaderboard,
  getWealthLeaderboard,
  type RankingEntry,
} from "../services/RankingService";
import {
  adminClearBattleState,
  adminCreateBanner,
  adminCreateCharacter,
  adminCreateEvent,
  adminGiveResources,
  adminRemoveResources,
} from "../services/AdminService";
import { lootBoxService } from "../services/LootBoxService";
import { equipmentService } from "../services/EquipmentService";
import { handleRaidCommand } from "./raid-handlers";
import { raidService } from "../services/RaidService";
import * as BossRushService from "../services/BossRushService";
import * as ProfileService from "../services/ProfileService";
import { getRaidById } from "@workspace/db/data/raid-catalog";
import { db } from "@workspace/db";
import { raidInstances, users, raidInstanceParticipants } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { createRaidRoomEmbed, createBattleProgressEmbed as createBattleProgressEmbedStatic } from "./embeds";
import {
  applyEmbedImage,
  createBannersEmbed,
  createBattleResultEmbed,
  createBattleProgressEmbed,
  createInventoryEmbed,
  createLeaderboardEmbed,
  createProfileEmbed,
  createEnhancedProfileEmbed,
  createSummonResultEmbed,
  createSummonResultEmbeds,
  createTeamEmbed,
  formatUltimateSummary,
  createLootBoxShopEmbed,
  createLootBoxOpeningEmbed,
  createLootBoxHistoryEmbed,
  createDailyFreeBoxEmbed,
  createEquipmentDetailsEmbed,
  createEquipmentInventoryEmbed,
  createEquipmentCatalogEmbed,
  createEquipmentEquippedEmbed,
  createEquipmentUnequippedEmbed,
} from "./embeds";
import type { UltimateDecisionProvider } from "../battle/BattleState";
import { logger } from "../lib/logger";

type AutocompleteChoice = { name: string; value: string };
type OwnedCharacterChoiceSource = { ownedId: string; level: number; position?: number; character: { id?: string; name: string; anime: string; rarity: string; role?: string; ultimate?: CharacterUltimate | null } };

const ULTIMATE_INTERACTION_TIMEOUT_MS = 15_000;

/** Discord's timeout policy: save the prompt result and let server AI choose the
 * normal tactical action. The client never gets authority to spend charge. */
function discordUltimateDecisionProvider(interaction: ChatInputCommandInteraction): UltimateDecisionProvider {
  return async ({ actor, validTargets }) => {
    const message = await interaction.fetchReply();
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ultimate:use:${actor.id}`).setLabel(`Usar ${actor.skills.ultimate.name}`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`ultimate:hold:${actor.id}`).setLabel("Guardar carga").setStyle(ButtonStyle.Secondary),
    );
    const rows: Array<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>> = [buttons];
    if (actor.skills.ultimate.targetType.startsWith("single_") && validTargets.length > 1) {
      rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder().setCustomId(`ultimate:target:${actor.id}`).setPlaceholder("Selecione o alvo")
          .addOptions(validTargets.slice(0, 25).map((target) => ({ label: target.name.slice(0, 100), value: target.id }))),
      ));
    }
    await interaction.editReply({ content: `✨ **${actor.name}** está com **${actor.skills.ultimate.name}** PRONTA. Escolha em 15s; sem resposta, a IA decide.`, components: rows as any });
    try {
      const click: any = await (message as any).awaitMessageComponent({ componentType: ComponentType.Button, time: ULTIMATE_INTERACTION_TIMEOUT_MS, filter: (component: any) => component.user.id === interaction.user.id && component.customId.endsWith(actor.id) });
      await click.deferUpdate();
      if (click.customId.startsWith("ultimate:hold")) return null;
      let targetId = validTargets[0]?.id;
      if (actor.skills.ultimate.targetType.startsWith("single_") && validTargets.length > 1) {
        const targetMenu: any = await (message as any).awaitMessageComponent({ componentType: ComponentType.StringSelect, time: ULTIMATE_INTERACTION_TIMEOUT_MS, filter: (component: any) => component.user.id === interaction.user.id && component.customId === `ultimate:target:${actor.id}` });
        targetId = targetMenu.values[0];
        await targetMenu.deferUpdate();
      }
      return { actorId: actor.id, targetId, useUltimate: true };
    } catch {
      // Expiration intentionally returns null: BattleEngine falls back to AI.
      return null;
    } finally {
      await interaction.editReply({ components: [] });
    }
  };
}

function formatCharacterChoice(item: OwnedCharacterChoiceSource, position?: number): AutocompleteChoice {
  const prefix = position ? `#${position} • ` : "";
  const name = `${prefix}${item.character.name} (${item.character.anime}) Nv.${item.level} • ${item.ownedId.slice(0, 8)}`;
  return { name: name.slice(0, 100), value: item.ownedId };
}

function filterChoicesByFocusedValue(choices: AutocompleteChoice[], focusedValue: string) {
  const query = focusedValue.trim().toLowerCase();
  if (!query) return choices.slice(0, 25);
  return choices.filter((choice) => `${choice.name} ${choice.value}`.toLowerCase().includes(query)).slice(0, 25);
}

async function respondToAutocomplete(interaction: AutocompleteInteraction, choices: AutocompleteChoice[]): Promise<void> {
  if (interaction.responded) return;

  try {
    await interaction.respond(choices);
  } catch (err: unknown) {
    // Discord can deliver the same autocomplete interaction more than once.
    // A second response is harmless and should not crash the bot process.
    if ((err as { code?: number }).code === 40060) return;
    throw err;
  }
}

function formatPveStageChoice(stage: Awaited<ReturnType<typeof listPveStages>>[number], worldName?: string): AutocompleteChoice {
  const world = worldName ?? `Mundo ${stage.worldId.slice(0, 8)}`;
  const name = `${world} / Fase ${stage.position} • ${stage.name} — ${stage.enemyName}`;
  return { name: name.slice(0, 100), value: stage.id };
}

function createProgressBar(current: number, max: number, length: number = 10): string {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

export async function handleAutocompleteInteraction(interaction: AutocompleteInteraction): Promise<void> {
  try {
    if (interaction.commandName === "invocar") {
      const focused = interaction.options.getFocused(true);
      if (focused.name === "banner") {
        const activeBanners = await listActiveBanners();
        const choices = activeBanners.map((banner) => ({ name: banner.name, value: banner.id }));
        await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
        return;
      }
      await respondToAutocomplete(interaction, []);
      return;
    }

    // Autocomplete para /perfil showcase e banner
    if (interaction.commandName === "perfil") {
      const focused = interaction.options.getFocused(true);
      const discordId = interaction.user.id;

      try {
        // Autocomplete para showcase (personagens possuídos)
        if (focused.name.startsWith("slot")) {
          const profile = await getProfile(discordId);
          if (!profile) {
            await respondToAutocomplete(interaction, []);
            return;
          }

          const choices = profile.collection.map((item: any) => ({
            name: `${item.character.name} (${item.character.anime}) Nv.${item.level}`,
            value: item.ownedId,
          }));

          await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
          return;
        }

        // Autocomplete para banner (personagens do catálogo)
        if (focused.name === "personagem") {
          const allCharacters = await listCharacters();
          const choices = allCharacters
            .filter((char) => char.imageUrl) // Só personagens com imagem
            .map((char) => ({
              name: `${char.name} (${char.anime})`,
              value: char.id,
            }));

          await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
          return;
        }
      } catch (error) {
        console.error("[PERFIL AUTOCOMPLETE ERROR]", error);
      }

      await respondToAutocomplete(interaction, []);
      return;
    }

    if (interaction.commandName === "batalha") {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== "estagio_id") {
        await respondToAutocomplete(interaction, []);
        return;
      }

      const [stages, worlds] = await Promise.all([listPveStages(), listPveWorlds()]);
      console.log(`[AUTOCOMPLETE BATALHA] Found ${stages.length} stages and ${worlds.length} worlds`);
      
      const worldNames = new Map(worlds.map((world) => [world.id, world.name]));
      const choices = stages.map((stage) => formatPveStageChoice(stage, worldNames.get(stage.worldId)));
      
      console.log(`[AUTOCOMPLETE BATALHA] Generated ${choices.length} choices`);
      
      await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
      return;
    }

    // Autocomplete para /equipamento
    if (interaction.commandName === "equipamento") {
      const focused = interaction.options.getFocused(true);
      const subcommand = interaction.options.getSubcommand();
      
      try {
        const profile = await getProfile(discordId);
        if (!profile) {
          await respondToAutocomplete(interaction, []);
          return;
        }
        
        // Autocomplete de personagem
        if (focused.name === "personagem") {
          const choices = profile.collection.map((item) => ({
            name: `${item.character.name} (${item.character.anime}) Nv.${item.level}`,
            value: item.ownedId
          }));
          await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
          return;
        }
        
        // Autocomplete de equipamento do inventário
        if (focused.name === "equipamento") {
          const userEquipments = await equipmentService.listUserEquipment(profile.user.id);
          const choices = userEquipments.map((item) => ({
            name: `${item.equipment.name} [${item.equipment.rarity}]`,
            value: item.id
          }));
          await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
          return;
        }
        
        // Autocomplete de equipamento do catálogo (para /equipamento info)
        if (focused.name === "nome") {
          const catalog = await equipmentService.listCatalog();
          const choices = catalog.map((equip) => ({
            name: `${equip.name} [${equip.rarity}]`,
            value: equip.name
          }));
          await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
          return;
        }
        
      } catch (error) {
        console.error("[EQUIPMENT AUTOCOMPLETE ERROR]", error);
      }
      
      await respondToAutocomplete(interaction, []);
      return;
    }

    if (interaction.commandName !== "equipe") {
      await respondToAutocomplete(interaction, []);
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "personagem_id") {
      await respondToAutocomplete(interaction, []);
      return;
    }

    const discordId = interaction.user.id;
    
    // Timeout de 2.5 segundos para garantir resposta a tempo
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    
    const dataPromise = (async () => {
      const teamData = await getTeam(discordId);
      const currentMembers: OwnedCharacterChoiceSource[] = teamData?.members ?? [];

      if (subcommand === "adicionar") {
        const profile = await getProfile(discordId);
        
        if (!profile || !profile.collection || profile.collection.length === 0) {
          return [];
        }
        
        const currentOwnedIds = new Set(currentMembers.map((member) => member.ownedId));
        const choices = ((profile.collection ?? []) as OwnedCharacterChoiceSource[])
          .filter((item) => !currentOwnedIds.has(item.ownedId))
          .map((item) => formatCharacterChoice(item));
        
        return filterChoicesByFocusedValue(choices, String(focused.value));
      }

      if (subcommand === "remover" || subcommand === "mover") {
        const choices = currentMembers.map((member) => formatCharacterChoice(member, member.position));
        return filterChoicesByFocusedValue(choices, String(focused.value));
      }

      return [];
    })();
    
    const result = await Promise.race([dataPromise, timeoutPromise]);
    await respondToAutocomplete(interaction, result ?? []);
    
  } catch (error) {
    console.error("Autocomplete error:", error);
    // Sempre responder, mesmo com erro
    try {
      await respondToAutocomplete(interaction, []);
    } catch (e) {
      // Ignorar erro de resposta
    }
  }
}

/**
 * ========================================
 * BOSS RUSH HANDLER
 * ========================================
 */
async function handleBossRushCommand(interaction: ChatInputCommandInteraction, discordId: string) {
  const subcommand = interaction.options.getSubcommand();

  // /bossrush ranking
  if (subcommand === "ranking") {
    await interaction.deferReply();
    
    const season = await BossRushService.getActiveSeason();
    if (!season) {
      await interaction.editReply("❌ Nenhuma temporada ativa no momento.");
      return;
    }

    const leaderboard = await BossRushService.getLeaderboard(season.id, 20);

    if (leaderboard.length === 0) {
      await interaction.editReply("🏆 **Boss Rush - Ranking Semanal**\n\nAinda não há participantes nesta temporada!");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 Boss Rush - Ranking Semanal")
      .setDescription(`**Temporada:** ${season.name}\n**Termina:** <t:${Math.floor(new Date(season.endDate).getTime() / 1000)}:R>`)
      .setColor(0xFFD700);

    let description = "";
    for (const entry of leaderboard) {
      const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
      const time = entry.completionTime > 0 ? `${Math.floor(entry.completionTime / 60)}m ${entry.completionTime % 60}s` : "N/A";
      description += `${medal} **${entry.username}** - ${entry.bossesDefeated}/5 bosses | ${time} | ${entry.totalDamageDealt.toLocaleString()} dmg\n`;
    }

    embed.addFields({ name: "📊 Top 20", value: description || "Nenhum registro" });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // /bossrush info
  if (subcommand === "info") {
    await interaction.deferReply();
    
    const season = await BossRushService.getActiveSeason();
    if (!season) {
      await interaction.editReply("❌ Nenhuma temporada ativa no momento.");
      return;
    }

    const bestRun = await BossRushService.getUserBestRun(discordId, season.id);

    const embed = new EmbedBuilder()
      .setTitle("🔥 Boss Rush - Informações")
      .setDescription(
        `**Boss Rush** é um desafio épico onde você enfrenta **5 bosses consecutivos** sem curar entre as batalhas!\n\n` +
        `**Regras:**\n` +
        `• 5 bosses com dificuldade escalável\n` +
        `• HP do time NÃO é restaurado entre lutas\n` +
        `• Quanto mais longe chegar, melhores as recompensas\n` +
        `• Ranking semanal com os melhores desempenhos\n\n` +
        `**Temporada Atual:** ${season.name}\n` +
        `**Termina:** <t:${Math.floor(new Date(season.endDate).getTime() / 1000)}:R>`
      )
      .setColor(0xFF4500);

    if (bestRun) {
      const time = bestRun.completionTime > 0 ? `${Math.floor(bestRun.completionTime / 60)}m ${bestRun.completionTime % 60}s` : "N/A";
      embed.addFields({
        name: "📜 Sua Melhor Corrida",
        value:
          `**Bosses Derrotados:** ${bestRun.bossesDefeated}/5\n` +
          `**Tempo:** ${time}\n` +
          `**Dano Total:** ${bestRun.totalDamageDealt.toLocaleString()}\n` +
          `**Recompensas:** 💰 ${bestRun.rewardGold.toLocaleString()} Gold | 💎 ${bestRun.rewardGems} Gems`,
      });
    } else {
      embed.addFields({
        name: "📜 Sua Melhor Corrida",
        value: "Você ainda não participou desta temporada! Use `/bossrush iniciar` para começar!",
      });
    }

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // /bossrush iniciar
  if (subcommand === "iniciar") {
    await interaction.deferReply();

    const velocidade = interaction.options.getString("velocidade") ?? "slow";
    const animationDelay = velocidade === "fast" ? 50 : velocidade === "instant" ? 0 : 100;

    try {
      // Iniciar Boss Rush
      const { runId, bosses, playerTeam, seasonId } = await BossRushService.startBossRush(discordId);

      const startTime = Date.now();
      let currentPlayerTeam = playerTeam;
      let bossesDefeated = 0;
      let totalDamageDealt = 0;

      // Embed inicial
      const initialEmbed = new EmbedBuilder()
        .setTitle("🔥 BOSS RUSH INICIADO!")
        .setDescription(
          `Prepare-se! Você enfrentará **5 bosses consecutivos**!\n\n` +
          `**⚠️ SEU TIME NÃO SERÁ CURADO ENTRE AS BATALHAS!**\n\n` +
          `**Time:**\n` +
          currentPlayerTeam.map((c) => `• ${c.name} - ${c.hp}/${c.maxHp} HP`).join("\n")
        )
        .setColor(0xFF4500);

      await interaction.editReply({ embeds: [initialEmbed] });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Loop pelos 5 bosses
      for (let i = 0; i < bosses.length; i++) {
        const boss = bosses[i];

        // Embed de início de boss
        const bossIntroEmbed = new EmbedBuilder()
          .setTitle(`⚔️ BOSS ${i + 1}/5: ${boss.name}`)
          .setDescription(
            `**Anime:** ${boss.anime}\n` +
            `**HP:** ${boss.hp.toLocaleString()}\n` +
            `**Ataque:** ${boss.attack}\n` +
            `**Defesa:** ${boss.defense}\n` +
            `**Velocidade:** ${boss.speed}\n` +
            `**Multiplicador:** ${(boss.difficultyMultiplier * 100).toFixed(0)}%\n\n` +
            `**Seu Time:**\n` +
            currentPlayerTeam.map((c) => {
              const hpPercent = Math.floor((c.hp / c.maxHp) * 100);
              const hpBar = "█".repeat(Math.floor(hpPercent / 10)) + "░".repeat(10 - Math.floor(hpPercent / 10));
              return `• ${c.name} ${hpBar} ${c.hp}/${c.maxHp} HP (${hpPercent}%)`;
            }).join("\n")
          )
          .setColor(0xFF0000);

        await interaction.editReply({ embeds: [bossIntroEmbed] });
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Lutar contra o boss
        const battleResult = await BossRushService.fightBoss(
          currentPlayerTeam,
          boss,
          async (snapshot) => {
            if (animationDelay > 0) {
              const embed = createBattleProgressEmbed(snapshot);
              await interaction.editReply({ embeds: [embed] });
              await new Promise((resolve) => setTimeout(resolve, animationDelay));
            }
          }
        );

        totalDamageDealt += battleResult.damageDealt;

        if (!battleResult.victory) {
          // DERROTA
          const completionTime = Math.floor((Date.now() - startTime) / 1000);
          await BossRushService.completeBossRush(runId, interaction.user.id, seasonId, bossesDefeated, totalDamageDealt, completionTime);

          const defeatEmbed = new EmbedBuilder()
            .setTitle("💀 BOSS RUSH - DERROTA")
            .setDescription(
              `Você foi derrotado pelo **${boss.name}** (Boss ${i + 1}/5)!\n\n` +
              `**Bosses Derrotados:** ${bossesDefeated}/5\n` +
              `**Dano Total:** ${totalDamageDealt.toLocaleString()}\n` +
              `**Tempo:** ${Math.floor(completionTime / 60)}m ${completionTime % 60}s\n\n` +
              `**Recompensas:** 💰 ${(500 * bossesDefeated * bossesDefeated).toLocaleString()} Gold | 💎 ${50 * bossesDefeated} Gems`
            )
            .setColor(0x8B0000);

          await interaction.editReply({ embeds: [defeatEmbed] });
          return;
        }

        // VITÓRIA neste boss
        bossesDefeated++;
        currentPlayerTeam = battleResult.playerTeamAfter;

        const victoryEmbed = new EmbedBuilder()
          .setTitle(`✅ BOSS ${i + 1}/5 DERROTADO!`)
          .setDescription(
            `Você derrotou **${boss.name}**!\n\n` +
            `**Dano Causado:** ${battleResult.damageDealt.toLocaleString()}\n\n` +
            `**Time Restante:**\n` +
            currentPlayerTeam
              .filter((c) => c.alive)
              .map((c) => {
                const hpPercent = Math.floor((c.hp / c.maxHp) * 100);
                const hpBar = "█".repeat(Math.floor(hpPercent / 10)) + "░".repeat(10 - Math.floor(hpPercent / 10));
                return `• ${c.name} ${hpBar} ${c.hp}/${c.maxHp} HP (${hpPercent}%)`;
              })
              .join("\n") || "❌ Nenhum sobrevivente"
          )
          .setColor(0x00FF00);

        await interaction.editReply({ embeds: [victoryEmbed] });
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Verificar se ainda tem personagens vivos
        if (!currentPlayerTeam.some((c) => c.alive)) {
          const completionTime = Math.floor((Date.now() - startTime) / 1000);
          const result = await BossRushService.completeBossRush(runId, interaction.user.id, seasonId, bossesDefeated, totalDamageDealt, completionTime);

          const completeEmbed = new EmbedBuilder()
            .setTitle("💀 BOSS RUSH - TIME ELIMINADO")
            .setDescription(
              `Todos os seus personagens foram derrotados!\n\n` +
              `**Bosses Derrotados:** ${bossesDefeated}/5\n` +
              `**Dano Total:** ${totalDamageDealt.toLocaleString()}\n` +
              `**Tempo:** ${Math.floor(completionTime / 60)}m ${completionTime % 60}s\n` +
              (result.rank ? `**Rank:** #${result.rank}\n` : "") +
              `\n**Recompensas:** 💰 ${result.rewards.gold.toLocaleString()} Gold | 💎 ${result.rewards.gems} Gems`
            )
            .setColor(0x8B0000);

          await interaction.editReply({ embeds: [completeEmbed] });
          return;
        }
      }

      // VITÓRIA TOTAL (5/5 bosses)
      const completionTime = Math.floor((Date.now() - startTime) / 1000);
      const result = await BossRushService.completeBossRush(runId, interaction.user.id, seasonId, bossesDefeated, totalDamageDealt, completionTime);

      const completeEmbed = new EmbedBuilder()
        .setTitle("👑 BOSS RUSH - VITÓRIA COMPLETA!")
        .setDescription(
          `🎉 **PARABÉNS!** Você derrotou todos os 5 bosses!\n\n` +
          `**Dano Total:** ${totalDamageDealt.toLocaleString()}\n` +
          `**Tempo:** ${Math.floor(completionTime / 60)}m ${completionTime % 60}s\n` +
          (result.rank ? `**Rank:** #${result.rank}\n` : "") +
          `\n**Recompensas:** 💰 ${result.rewards.gold.toLocaleString()} Gold | 💎 ${result.rewards.gems} Gems`
        )
        .setColor(0xFFD700);

      await interaction.editReply({ embeds: [completeEmbed] });
    } catch (error: any) {
      console.error("[BOSS RUSH ERROR]", error);
      await interaction.editReply(`❌ Erro: ${error.message}`);
    }
    return;
  }
}

export async function handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName, user } = interaction;
  const discordId = user.id;
  const username = user.username;

  try {
    // Defer IMEDIATAMENTE para evitar timeout de 3 segundos
    // Alguns comandos podem sobrescrever com seu próprio defer
    const shouldDeferEarly = ["personagem", "perfil", "invocar", "banner", "personagens", "equipe", "batalha", "meta", "arena", "equipamento", "loja", "lootbox", "raid", "bossrush"];
    
    if (shouldDeferEarly.includes(commandName)) {
      try {
        await interaction.deferReply();
      } catch (deferError) {
        console.error(`Failed to defer ${commandName}:`, deferError);
        // Se o defer falhar, tentamos responder diretamente
        return;
      }
    }

    // 1. /perfil
    if (commandName === "perfil") {
      const subcommand = interaction.options.getSubcommand(false);

      // /perfil ver (ou sem subcomando - default)
      if (!subcommand || subcommand === "ver") {
        try {
          const enhancedProfile = await ProfileService.getEnhancedProfile(discordId);
          const embed = createEnhancedProfileEmbed(enhancedProfile);
          await interaction.editReply({ embeds: [embed] });
        } catch (error: any) {
          console.error("[PERFIL] Error:", error);
          await interaction.editReply(`❌ Erro ao carregar perfil: ${error.message}`);
        }
        return;
      }

      // /perfil bio
      if (subcommand === "bio") {
        const bio = interaction.options.getString("texto", true);
        await ProfileService.updateProfileCustomization(discordId, { bio });
        await interaction.editReply("✅ Bio atualizada com sucesso!");
        return;
      }

      // /perfil anime
      if (subcommand === "anime") {
        const favoriteAnime = interaction.options.getString("nome", true);
        await ProfileService.updateProfileCustomization(discordId, { favoriteAnime });
        await interaction.editReply(`✅ Anime favorito definido: **${favoriteAnime}**`);
        return;
      }

      // /perfil cor
      if (subcommand === "cor") {
        const profileColor = interaction.options.getString("cor", true);
        await ProfileService.updateProfileCustomization(discordId, { profileColor });
        await interaction.editReply("✅ Cor do perfil atualizada!");
        return;
      }

      // /perfil showcase
      if (subcommand === "showcase") {
        const slot1 = interaction.options.getString("slot1", true);
        const slot2 = interaction.options.getString("slot2");
        const slot3 = interaction.options.getString("slot3");

        await ProfileService.updateProfileCustomization(discordId, {
          showcaseSlot1: slot1,
          showcaseSlot2: slot2,
          showcaseSlot3: slot3,
        });

        await interaction.editReply("✅ Showcase atualizado! Seus personagens favoritos agora aparecem no perfil.");
        return;
      }

      // /perfil banner
      if (subcommand === "banner") {
        const characterId = interaction.options.getString("personagem", true);
        await ProfileService.updateProfileCustomization(discordId, {
          bannerCharacterId: characterId,
        });
        await interaction.editReply("✅ Banner do perfil atualizado! A imagem do personagem agora aparece no seu perfil.");
        return;
      }

      return;
    }

    // 2. /invocar
    if (commandName === "invocar") {
      try {
        const quantity = (interaction.options.getInteger("quantidade") ?? 1) as 1 | 10;
        let bannerId = interaction.options.getString("banner");

        if (!bannerId) {
          const activeBanners = await listActiveBanners();
          if (!activeBanners.length) {
            await interaction.editReply("❌ Nenhum banner de invocação ativo no momento.");
            return;
          }
          if (activeBanners.length > 1) {
            await interaction.editReply("⚠️ Existem múltiplos banners ativos. Por favor, selecione um banner para invocar.");
            return;
          }
          bannerId = activeBanners[0].id;
        }

        const idempotencyKey = `bot_summon_${discordId}_${Date.now()}`;
        const result = await summon(discordId, bannerId!, quantity, idempotencyKey);
        
        console.log(`✅ [SUMMON] User ${discordId} summoned ${result.results.length} characters`);
        
        // Atualizar progresso de missões e stats
        try {
          await updateQuestProgress(discordId, "summon", quantity);
          const { incrementSummons } = await import("../services/RankingService");
          await incrementSummons(discordId, quantity);
        } catch (err) {
          console.error("[QUEST/STATS] Failed to update summon progress:", err);
        }
        
        // Verificar se os personagens foram adicionados
        const profileAfterSummon = await getProfile(discordId);
        console.log(`✅ [SUMMON] Profile collection size: ${profileAfterSummon?.collection?.length ?? 0}`);
        
        const embeds = createSummonResultEmbeds(username, result.results, result.currency, result.cost);
        await interaction.editReply({ embeds });
      } catch (error: any) {
        console.error("❌ [SUMMON ERROR]", error);
        await interaction.editReply(`❌ Erro ao invocar: ${error.message}`).catch(() => {});
      }
      return;
    }

    // 3. /banner
    if (commandName === "banner") {
      const activeBanners = await listActiveBanners();
      const result = createBannersEmbed(activeBanners);
      // createBannersEmbed retorna um array de embeds ou um único embed (sem banners)
      const embeds = Array.isArray(result) ? result : [result];
      await interaction.editReply({ embeds });
      return;
    }

    // 4. /personagens
    if (commandName === "personagens") {
      const animeFilter = interaction.options.getString("anime") ?? undefined;
      const rarityFilter = (interaction.options.getString("raridade") as any) ?? undefined;

      const profile = await getProfile(discordId);
      const catalog = await listCharacters({ anime: animeFilter, rarity: rarityFilter });

      // Emojis para raridades
      const rarityEmojis: Record<string, string> = {
        comum: "⚪",
        raro: "🔵",
        epico: "🟣",
        lendario: "🟡",
        mitico: "🔴",
      };

      // Emojis para roles
      const roleEmojis: Record<string, string> = {
        dps: "⚔️",
        tank: "🛡️",
        suporte: "💚",
        support: "💚",
        controle: "🎯",
      };

      const ownedIds = new Set(profile?.collection.map((c: OwnedCharacterChoiceSource) => c.character.id) ?? []);
      const ownedCount = catalog.filter((c) => ownedIds.has(c.id)).length;

      // Ordenar: possuídos primeiro, depois por raridade
      const rarityOrder: Record<string, number> = { mitico: 5, lendario: 4, epico: 3, raro: 2, comum: 1 };
      const sorted = [...catalog].sort((a, b) => {
        const aOwned = ownedIds.has(a.id) ? 1 : 0;
        const bOwned = ownedIds.has(b.id) ? 1 : 0;
        if (aOwned !== bOwned) return bOwned - aOwned; // Possuídos primeiro
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0); // Depois por raridade
      });

      // Paginação: 6 por página
      const perPage = 6;
      const totalPages = Math.ceil(sorted.length / perPage);
      const page = 0; // Primeira página

      const start = page * perPage;
      const end = start + perPage;
      const pageCharacters = sorted.slice(start, end);

      // Título e descrição
      let filterText = "";
      if (animeFilter) filterText += `📺 **${animeFilter}**`;
      if (rarityFilter) filterText += (filterText ? " • " : "") + `${rarityEmojis[rarityFilter] || "⭐"} **${rarityFilter.toUpperCase()}**`;

      const embed = new EmbedBuilder()
        .setTitle("🎴 Catálogo de Personagens")
        .setColor(rarityFilter === "mitico" ? 0xff0000 : rarityFilter === "lendario" ? 0xffd700 : rarityFilter === "epico" ? 0x9b59b6 : rarityFilter === "raro" ? 0x3498db : 0x95a5a6)
        .setDescription(
          `${filterText ? `**Filtros:** ${filterText}\n` : ""}` +
          `📊 **Progresso:** ${ownedCount}/${catalog.length} personagens (${Math.round((ownedCount / catalog.length) * 100)}%)\n` +
          `📖 Página ${page + 1}/${totalPages}`
        );

      // Cards de personagens
      if (pageCharacters.length === 0) {
        embed.addFields({
          name: "❌ Nenhum personagem encontrado",
          value: "Tente ajustar os filtros.",
        });
      } else {
        for (const c of pageCharacters) {
          const owned = ownedIds.has(c.id);
          const rarityEmoji = rarityEmojis[c.rarity] || "⭐";
          const roleEmoji = roleEmojis[c.role.toLowerCase()] || "❓";
          
          const ownedSymbol = owned ? "✅ **POSSUÍDO**" : "🔒 *Não possuído*";
          
          embed.addFields({
            name: `${rarityEmoji} ${c.name} ${roleEmoji}`,
            value:
              `${ownedSymbol}\n` +
              `📺 ${c.anime} • ${c.rarity.toUpperCase()} • ${c.role.toUpperCase()}\n` +
              `💪 HP: ${c.baseHp} | ATK: ${c.baseAttack} | DEF: ${c.baseDefense} | SPD: ${c.baseSpeed}`,
            inline: true,
          });
        }
      }

      // Thumbnail da primeira personagem
      if (pageCharacters.length > 0) {
        applyEmbedImage(embed, pageCharacters[0].imageUrl);
      }

      // Footer com dica
      embed.setFooter({ text: "💡 Use /personagem <nome> para ver detalhes completos" });

      // Botões de navegação (se houver mais de 1 página)
      if (totalPages > 1) {
        const row = new ActionRowBuilder<any>().addComponents(
          new ButtonBuilder()
            .setCustomId(`chars_page:${page - 1}:${animeFilter || ""}:${rarityFilter || ""}`)
            .setLabel("◀️ Anterior")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`chars_page:${page + 1}:${animeFilter || ""}:${rarityFilter || ""}`)
            .setLabel("Próxima ▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.editReply({ embeds: [embed] });
      }
      return;
    }

    // 5. /personagem
    if (commandName === "personagem") {
      try {
        const query = interaction.options.getString("nome", true).toLowerCase();
        const catalog = await listCharacters({});
        const found = catalog.find((c: any) => c.name.toLowerCase().includes(query) || c.id === query);

        if (!found) {
          await interaction.editReply("❌ Personagem não encontrado no catálogo.");
          return;
        }

        // Buscar se o usuário possui este personagem
        const profile = await getProfile(discordId);
        const ownedChar = profile?.collection.find((c: any) => c.character.id === found.id);
        
        // Import do MasteryService
        const { applyMasteryBoost, formatMasteryInfo, calculateMasteryBoost } = await import("../services/MasteryService");
        
        // Se possui, mostrar stats com maestria
        let displayStats;
        let masteryInfo = "";
        let ownershipInfo = "";
        
        if (ownedChar) {
          const masteryLevel = ownedChar.masteryLevel || 1;
          const masteryXp = ownedChar.masteryXp || 0;
          
          // Calcula stats com boost
          const boosted = applyMasteryBoost(
            found.baseHp,
            found.baseAttack,
            found.baseDefense,
            found.baseSpeed,
            masteryLevel
          );
          
          displayStats = {
            hp: boosted.hp,
            attack: boosted.attack,
            defense: boosted.defense,
            speed: boosted.speed,
          };
          
          masteryInfo = formatMasteryInfo(masteryLevel, masteryXp);
          
          // Mostrar boost percentual
          const boost = calculateMasteryBoost(masteryLevel);
          if (masteryLevel > 1) {
            ownershipInfo = `\n🌟 **Você possui este personagem!**\n` +
              `💪 Boost: HP +${boost.hpBonus}%, ATK +${boost.attackBonus}%, DEF +${boost.defenseBonus}%, SPD +${boost.speedBonus}%`;
          } else {
            ownershipInfo = `\n🌟 **Você possui este personagem!**`;
          }
        } else {
          // Não possui, mostrar stats base
          displayStats = {
            hp: found.baseHp,
            attack: found.baseAttack,
            defense: found.baseDefense,
            speed: found.baseSpeed,
          };
          ownershipInfo = "\n❓ Você ainda não possui este personagem.";
        }

        // Formatar detalhes da passiva
        let passiveDetails = found.passive ?? "Nenhuma";
        
        if (found.passiveAbility) {
          const pa = found.passiveAbility;
          
          // Trigger formatado
          const triggerMap: Record<string, string> = {
            "on_battle_start": "Início da Batalha",
            "on_round_start": "Início de Rodada",
            "on_turn_start": "Início do Turno",
            "on_hit": "Ao Acertar",
            "on_critical_hit": "Ao Dar Crítico",
            "on_damaged": "Ao Receber Dano",
            "on_kill": "Ao Derrotar Inimigo",
            "on_basic_attack": "Ao Atacar (Básico)",
            "always": "Sempre Ativo",
          };
          
          const triggerText = triggerMap[pa.trigger] || pa.trigger;
          
          // Efeitos formatados (máx 3 para não ficar grande)
          const effectsList: string[] = [];
          for (const effect of pa.effects.slice(0, 3)) {
            const effectMap: Record<string, string> = {
              "increase_attack": `+${effect.value}% Ataque`,
              "increase_defense": `+${effect.value}% Defesa`,
              "increase_speed": `+${effect.value} Velocidade`,
              "increase_crit_chance": `+${effect.value}% Chance Crítico`,
              "increase_crit_damage": `+${effect.value}% Dano Crítico`,
              "bonus_damage_percent": `+${effect.value}% Dano`,
              "lifesteal": `${effect.value}% Lifesteal`,
              "heal_percent": `Cura ${effect.value}% HP`,
              "heal_self": `Cura ${effect.value} HP`,
              "damage_reduction": `${effect.value}% Redução de Dano`,
              "shield": `Escudo de ${effect.value} HP`,
              "reflect_damage": `Reflete ${effect.value}% do Dano`,
              "counter_attack": `Contra-ataque ${effect.value}%`,
              "gain_ultimate_charge": `+${effect.value} Carga Ultimate`,
              "apply_status": effect.statusType ? `Aplica ${effect.statusType}` : `Aplica Status`,
              "cleanse_debuff": `Remove ${effect.value} Debuff(s)`,
            };
            
            const effectText = effectMap[effect.type] || effect.type;
            effectsList.push(effectText);
          }
          
          // Condições formatadas (máx 2)
          const conditionsList: string[] = [];
          if (pa.conditions && pa.conditions.length > 0) {
            for (const condition of pa.conditions.slice(0, 2)) {
              const condMap: Record<string, string> = {
                "hp_below_percent": `HP < ${condition.value}%`,
                "hp_above_percent": `HP > ${condition.value}%`,
                "target_hp_below_percent": `Alvo HP < ${condition.value}%`,
                "is_critical": "Crítico",
                "is_last_standing": "Último Vivo",
                "round_above": `Após Rodada ${condition.value}`,
              };
              
              const condText = condMap[condition.type] || condition.type;
              conditionsList.push(condText);
            }
          }
          
          // Limites
          const limits: string[] = [];
          if (pa.maxActivationsPerBattle) {
            limits.push(`${pa.maxActivationsPerBattle}x por batalha`);
          }
          if (pa.maxActivationsPerRound) {
            limits.push(`${pa.maxActivationsPerRound}x por rodada`);
          }
          if (pa.cooldownRounds) {
            limits.push(`${pa.cooldownRounds} rodadas de cooldown`);
          }
          
          // Monta descrição completa
          passiveDetails = `**${pa.name}**\n${pa.description}\n\n` +
            `**🎯 Trigger:** ${triggerText}\n` +
            `**💫 Efeitos:** ${effectsList.join(", ")}`;
          
          if (conditionsList.length > 0) {
            passiveDetails += `\n**✅ Condições:** ${conditionsList.join(", ")}`;
          }
          
          if (limits.length > 0) {
            passiveDetails += `\n**⏱️ Limites:** ${limits.join(", ")}`;
          }
        }

        const embed = new EmbedBuilder()
          .setTitle(`🎴 ${found.name}`)
          .setColor(ownedChar ? 0x2ecc71 : 0xf1c40f)
          .setDescription(ownershipInfo)
          .addFields(
            { name: "📺 Anime", value: found.anime, inline: true },
            { name: "⭐ Raridade", value: found.rarity.toUpperCase(), inline: true },
            { name: "🗡️ Função", value: found.role.toUpperCase(), inline: true }
          );
        
        // Adicionar maestria se possuir
        if (masteryInfo) {
          embed.addFields({ name: "✨ Maestria", value: masteryInfo, inline: false });
        }
        
        // Adicionar equipamento se possuir
        if (ownedChar) {
          try {
            const { equipmentService } = await import("../services/EquipmentService");
            const equipped = await equipmentService.getEquippedItem(ownedChar.ownedId);
            
            if (equipped) {
              const equip = equipped.equipment;
              const bonuses = [];
              if (equip.bonusHp > 0) bonuses.push(`+${equip.bonusHp} HP`);
              if (equip.bonusAttack > 0) bonuses.push(`+${equip.bonusAttack} ATK`);
              if (equip.bonusDefense > 0) bonuses.push(`+${equip.bonusDefense} DEF`);
              if (equip.bonusSpeed > 0) bonuses.push(`+${equip.bonusSpeed} SPD`);
              if (equip.bonusCritChance > 0) bonuses.push(`+${equip.bonusCritChance}% CRIT`);
              if (equip.bonusCritDamage > 0) bonuses.push(`+${equip.bonusCritDamage}% CRIT DMG`);
              
              let equipText = `**${equip.name}** [${equip.rarity}]\n`;
              equipText += `└─ ${bonuses.join(", ")}\n`;
              
              if (equip.passiveAbility) {
                const passive = equip.passiveAbility as any;
                equipText += `└─ 🔮 Passiva: ${passive.name || "Sem nome"}`;
              }
              
              embed.addFields({ name: "⚔️ Equipamento", value: equipText, inline: false });
            } else {
              embed.addFields({ name: "⚔️ Equipamento", value: "*Nenhum equipamento equipado*\n(Use `/equipamento equipar` para equipar)", inline: false });
            }
          } catch (error) {
            console.error("Error fetching equipment:", error);
          }
        }
        
        // Stats
        embed.addFields(
          { name: "❤️ HP", value: `${displayStats.hp}${ownedChar && ownedChar.masteryLevel > 1 ? ` (base: ${found.baseHp})` : ''}`, inline: true },
          { name: "⚔️ Ataque", value: `${displayStats.attack}${ownedChar && ownedChar.masteryLevel > 1 ? ` (base: ${found.baseAttack})` : ''}`, inline: true },
          { name: "🛡️ Defesa", value: `${displayStats.defense}${ownedChar && ownedChar.masteryLevel > 1 ? ` (base: ${found.baseDefense})` : ''}`, inline: true },
          { name: "⚡ Velocidade", value: `${displayStats.speed}${ownedChar && ownedChar.masteryLevel > 1 ? ` (base: ${found.baseSpeed})` : ''}`, inline: true },
          { name: "🔮 Passiva", value: passiveDetails.slice(0, 1024), inline: false },
          { name: "✨ Ultimate", value: formatUltimateSummary(found.ultimate), inline: false }
        );

        applyEmbedImage(embed, found.imageUrl);

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error("Error in /personagem command:", error);
        await interaction.editReply("❌ Erro ao buscar informações do personagem.").catch(() => {});
      }
      return;
    }

    // 5.5. /meta - Análise META de personagens
    if (commandName === "meta") {
      const catalog = await listCharacters({});
      
      // Criar select menu para categorias
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("meta_category")
        .setPlaceholder("📊 Selecione uma categoria META")
        .addOptions([
          { label: "🏆 Top Tier Geral", description: "Melhores personagens overall", value: "top_tier", emoji: "👑" },
          { label: "⚔️ Melhores DPS", description: "Máximo dano por segundo", value: "dps", emoji: "⚔️" },
          { label: "🛡️ Melhores Tanks", description: "Resistência e proteção", value: "tank", emoji: "🛡️" },
          { label: "🎯 Melhores Controle", description: "Crowd control e debuffs", value: "control", emoji: "🎯" },
          { label: "💚 Melhores Suporte", description: "Buffs e utility", value: "support", emoji: "💚" },
          { label: "🔰 Melhor Custo-Benefício", description: "Raros/Épicos fortes", value: "budget", emoji: "💎" },
          { label: "🌟 Broken/OP", description: "Personagens quebrados", value: "broken", emoji: "⚡" },
        ]);
      
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      
      const mainEmbed = new EmbedBuilder()
        .setTitle("📊 Análise META - Anime RPG")
        .setColor(0xFFD700)
        .setDescription(
          "**Bem-vindo à Análise META Profissional!**\n\n" +
          "Aqui você encontra os melhores personagens do jogo por categoria, " +
          "com análises detalhadas sobre por que estão no META e como usar.\n\n" +
          "🎯 **Use o menu abaixo** para selecionar uma categoria e ver:\n" +
          "• Rankings atualizados\n" +
          "• Análise de por que são META\n" +
          "• Melhores composições de equipe\n" +
          "• Pontos fortes e fracos\n\n" +
          `📈 **Total de ${catalog.length} personagens** no catálogo.`
        )
        .addFields(
          { name: "🏆 Top Tier", value: "Os melhores dos melhores", inline: true },
          { name: "⚔️ DPS", value: "Dano explosivo", inline: true },
          { name: "🛡️ Tank", value: "Muralha imbatível", inline: true },
          { name: "🎯 Controle", value: "Crowd control", inline: true },
          { name: "💚 Suporte", value: "Buffs e utility", inline: true },
          { name: "🔰 Budget", value: "Custo-benefício", inline: true }
        )
        .setFooter({ text: "⚡ META atualizado • Use o menu para navegar" })
        .setTimestamp();
      
      const response = await interaction.editReply({ embeds: [mainEmbed], components: [row] });
      
      // Collector para o menu
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 5 * 60 * 1000, // 5 minutos
      });
      
      collector.on("collect", async (menuInteraction) => {
        if (menuInteraction.user.id !== interaction.user.id) {
          await menuInteraction.reply({ content: "❌ Este menu não é seu!", ephemeral: true });
          return;
        }
        
        await menuInteraction.deferUpdate();
        const category = menuInteraction.values[0];
        
        let metaEmbed: EmbedBuilder;
        
        // Top Tier Geral
        if (category === "top_tier") {
          metaEmbed = new EmbedBuilder()
            .setTitle("👑 TOP TIER GERAL - S+ Tier")
            .setColor(0xFFD700)
            .setDescription("**Os melhores personagens do jogo, independente de categoria.**\n\n")
            .addFields(
              {
                name: "🥇 #1 - Sukuna (Mahoraga) [Mítico Tank]",
                value: "**Por que é META:**\n" +
                  "• Adaptação stacka até 60% resistência\n" +
                  "• Ultimate escala 3.0x → 6.0x com stacks\n" +
                  "• 1600 HP + 200 DEF = unkillable\n" +
                  "• Reflete 25% de dano em 40%+ resist\n" +
                  "**Melhor em:** Raids, Bosses, PvP Prolongado\n" +
                  "**Fraqueza:** Burst rápido antes de adaptar"
              },
              {
                name: "🥈 #2 - Itachi (Susanoo) [Lendário Control]",
                value: "**Por que é META:**\n" +
                  "• Totsuka Blade = debuffs PERMANENTES\n" +
                  "• -60% all stats = boss killer definitivo\n" +
                  "• Shield 500 + debuff immunity\n" +
                  "• +25% ATK enquanto tiver shield\n" +
                  "**Melhor em:** Boss Fights, PvE Difícil\n" +
                  "**Fraqueza:** Single target only"
              },
              {
                name: "🥉 #3 - Satoru Gojo [Raro Control]",
                value: "**Por que é META:**\n" +
                  "• 40% evasão = untouchable\n" +
                  "• Unlimited Void aturda TODOS por 2 turnos\n" +
                  "• Drena 30 carga + nega buffs 3 turnos\n" +
                  "• Evasão gera carga = ultimate frequente\n" +
                  "**Melhor em:** PvP, Speed clear, Controle\n" +
                  "**Fraqueza:** RNG dependent"
              },
              {
                name: "🏆 #4 - Yuta (Rika) [Mítico Support/DPS]",
                value: "**Por que é META:**\n" +
                  "• Transform mechanic: +30% ATK/+25% DEF/+20% SPD\n" +
                  "• Ultimate 3.5x → 5.6x com transform\n" +
                  "• Shield 500 AOE team quando transform ativo\n" +
                  "• Cura 25% HP ao ultar\n" +
                  "**Melhor em:** Raids, Team Protection\n" +
                  "**Fraqueza:** Precisa baixar HP para transform"
              },
              {
                name: "👑 #5 - Nakime [Lendário Support]",
                value: "**Por que é META:**\n" +
                  "• +15 carga POR RODADA para TODOS aliados\n" +
                  "• Ultimate buffa +30% ATK/DEF, +20% SPD AOE\n" +
                  "• Aturda todos inimigos + drena 20 carga\n" +
                  "• Ultimate battery = equipe spamma ultimates\n" +
                  "**Melhor em:** Any team comp, Universal\n" +
                  "**Fraqueza:** Nenhuma significativa"
              }
            )
            .setFooter({ text: "⚡ S+ Tier • Estes personagens dominam o META atual" });
        }
        
        // Melhores DPS
        else if (category === "dps") {
          metaEmbed = new EmbedBuilder()
            .setTitle("⚔️ MELHORES DPS - Damage Dealers")
            .setColor(0xFF0000)
            .setDescription("**Personagens especializados em causar máximo dano.**\n\n")
            .addFields(
              {
                name: "🥇 S+ Tier - Meliodas (Assault Mode) [Mítico]",
                value: "**240 ATK base • 1300 HP**\n" +
                  "• Ganha 2% ATK por 1% HP perdido (200% ATK em 1% HP!)\n" +
                  "• +50% crit chance abaixo de 30% HP\n" +
                  "• Ultimate 3.8x + scaling por HP perdido\n" +
                  "• Glass cannon extremo: high risk/high reward\n" +
                  "**Sinergia:** Equipes que protegem ele enquanto baixa HP"
              },
              {
                name: "🥈 S Tier - Ryomen Sukuna [Lendário]",
                value: "**240 ATK base • 1250 HP**\n" +
                  "• +15% crit chance permanente\n" +
                  "• Críticos curam 8% HP + sangram\n" +
                  "• Malevolent Shrine: garante crit, ignora 50% DEF\n" +
                  "• Vampiric DPS com sustain\n" +
                  "**Sinergia:** Builds de critical damage"
              },
              {
                name: "🥉 A+ Tier - Madara Uchiha [Lendário]",
                value: "**230 ATK base • 1150 HP**\n" +
                  "• 30% chance de Susanoo: shield + 50% dano\n" +
                  "• Perfect Susanoo: 3.2x → 4.48x com passiva\n" +
                  "• Penetra 40% defesa\n" +
                  "• Burst DPS com momentos épicos\n" +
                  "**Sinergia:** RNG builds, luck based"
              },
              {
                name: "🏆 A Tier - Nezuko [Mítico]",
                value: "**215 ATK base • 1250 HP**\n" +
                  "• Transform berserker: +40% ATK/+25% SPD/+30% crit\n" +
                  "• Sangue Explosivo: 3.0x → 4.5x em berserker\n" +
                  "• Queima ignora 30% DEF em berserker\n" +
                  "• DoT queen com transform mechanic\n" +
                  "**Sinergia:** Deixa HP baixo primeiro"
              },
              {
                name: "⚔️ B+ Tier - Pain [Lendário]",
                value: "**225 ATK base • 1200 HP**\n" +
                  "• Rinnegan: +10 carga por habilidade\n" +
                  "• A cada 3 ataques, próximo aturda\n" +
                  "• Shinra Tensei: 3.3x → 4.95x se stun ativo\n" +
                  "• Ultimate spammer com controle\n" +
                  "**Sinergia:** Builds de ultimate charge"
              }
            )
            .setFooter({ text: "⚔️ DPS Tier List • Foque em ATK, CRIT e penetração" });
        }
        
        // Melhores Tanks
        else if (category === "tank") {
          metaEmbed = new EmbedBuilder()
            .setTitle("🛡️ MELHORES TANKS - Muralhas Imbatíveis")
            .setColor(0x3498DB)
            .setDescription("**Personagens especializados em absorver dano e proteger.**\n\n")
            .addFields(
              {
                name: "🥇 S+ Tier - Sukuna (Mahoraga) [Mítico]",
                value: "**220 ATK • 1600 HP • 200 DEF**\n" +
                  "• Adaptação: +15% resist por tipo (stack 4x = 60%)\n" +
                  "• Reflete 25% dano em 40%+ resist\n" +
                  "• Ultimate cura 60% HP em 4 stacks\n" +
                  "• Literalmente fica mais forte quanto mais apanha\n" +
                  "**META:** THE tank definitivo, unkillable em longo prazo"
              },
              {
                name: "🥈 S Tier - Escanor [Mítico]",
                value: "**205 ATK • 1500 HP • 180 DEF**\n" +
                  "• The One: +5% ATK/DEF por rodada (10 stacks)\n" +
                  "• Imune a debuffs em 5+ stacks\n" +
                  "• Ultimate cura 10% HP por stack\n" +
                  "• Tank que escala infinitamente\n" +
                  "**META:** Quanto mais longa a luta, mais forte fica"
              },
              {
                name: "🥉 A Tier - Itachi (Susanoo) [Lendário]",
                value: "**215 ATK • 1150 HP • 140 DEF**\n" +
                  "• Começa com shield 500\n" +
                  "• Enquanto tiver shield: imune debuffs + 25% ATK\n" +
                  "• Hybrid tank/control\n" +
                  "• Proteção inicial forte\n" +
                  "**META:** Tank ofensivo com utility"
              },
              {
                name: "🏆 B+ Tier - Yuta (Rika) [Mítico]",
                value: "**240 ATK • 1350 HP • 140 DEF**\n" +
                  "• Transform <50% HP: shield 400 + buffs massivos\n" +
                  "• Ultimate dá shield 500 AOE team\n" +
                  "• Hybrid tank/support/dps\n" +
                  "• Proteção de equipe\n" +
                  "**META:** Team tank, protege todos"
              }
            )
            .setFooter({ text: "🛡️ Tank Tier List • Priorize HP, DEF e sustain" });
        }
        
        // Melhores Controle
        else if (category === "control") {
          metaEmbed = new EmbedBuilder()
            .setTitle("🎯 MELHORES CONTROLE - Crowd Control Masters")
            .setColor(0x9B59B6)
            .setDescription("**Personagens especializados em desabilitar e controlar inimigos.**\n\n")
            .addFields(
              {
                name: "🥇 S+ Tier - Satoru Gojo [Raro]",
                value: "**175 ATK • 900 HP • 140 SPD**\n" +
                  "• Infinito: 40% evasão + gera carga\n" +
                  "• Unlimited Void: aturda TODOS por 2 turnos\n" +
                  "• Drena 30 carga + nega buffs 3 turnos\n" +
                  "• Controle total de campo\n" +
                  "**META:** THE STRONGEST - melhor controle do jogo"
              },
              {
                name: "🥈 S Tier - Itachi (Susanoo) [Lendário]",
                value: "**215 ATK • 1150 HP • 130 SPD**\n" +
                  "• Totsuka Blade: debuffs PERMANENTES (duration 999)\n" +
                  "• -60% ATK/DEF/SPD pelo resto da batalha\n" +
                  "• Aturda 3 turnos\n" +
                  "• Boss eraser definitivo\n" +
                  "**META:** Single target delete button"
              },
              {
                name: "🥉 A+ Tier - Enel [Lendário]",
                value: "**195 ATK • 1050 HP • 145 SPD**\n" +
                  "• Passiva: 45% chance chocar + slow\n" +
                  "• Raigo: choca todos, aturda 85%, -40% SPD\n" +
                  "• Inimigos chocados tomam 60% mais dano\n" +
                  "• Speed demon + mass stun\n" +
                  "**META:** AOE control + damage amp"
              },
              {
                name: "🏆 A Tier - Meliodas (Marca Demoníaca) [Lendário]",
                value: "**210 ATK • 1100 HP • 140 SPD**\n" +
                  "• Hellblaze: anula cura por 3 turnos\n" +
                  "• Passiva stack reduz cura até 50%\n" +
                  "• Drena 15 carga de ultimate\n" +
                  "• Anti-heal META\n" +
                  "**META:** Hard counter de healers/sustain"
              },
              {
                name: "⚡ B+ Tier - Pain [Lendário]",
                value: "**225 ATK • 1200 HP • 120 SPD**\n" +
                  "• A cada 3 ataques, próximo aturda\n" +
                  "• Shinra Tensei: 80% stun AOE\n" +
                  "• -35% DEF, -30% SPD\n" +
                  "• Rinnegan synergy\n" +
                  "**META:** Stun cycling + debuffs"
              }
            )
            .setFooter({ text: "🎯 Control Tier List • Domine o campo de batalha" });
        }
        
        // Melhores Suporte
        else if (category === "support") {
          metaEmbed = new EmbedBuilder()
            .setTitle("💚 MELHORES SUPORTE - Team Enablers")
            .setColor(0x2ECC71)
            .setDescription("**Personagens especializados em buffar e fortalecer a equipe.**\n\n")
            .addFields(
              {
                name: "🥇 S+ Tier - Nakime [Lendário]",
                value: "**160 ATK • 1000 HP • 105 SPD**\n" +
                  "• Castelo Infinito: +15 carga POR RODADA para TODOS\n" +
                  "• Ultimate: +30% ATK/DEF, +20% SPD AOE\n" +
                  "• Aturda todos + drena 20 carga inimiga\n" +
                  "• Universal support, funciona em qualquer comp\n" +
                  "**META:** #1 suporte do jogo, ultimate battery insano"
              },
              {
                name: "🥈 S Tier - Yuta (Rika) [Mítico]",
                value: "**240 ATK • 1350 HP • 140 SPD**\n" +
                  "• Shield 500 AOE team quando ulta com transform\n" +
                  "• Transform: buffs massivos + proteção\n" +
                  "• Hybrid support/dps/tank\n" +
                  "• Team protection + damage\n" +
                  "**META:** All-in-one package, versátil"
              },
              {
                name: "🥉 A+ Tier - Enel [Lendário]",
                value: "**195 ATK • 1050 HP • 145 SPD**\n" +
                  "• Amplifica dano: inimigos chocados tomam 60% mais\n" +
                  "• Mass CC que habilita DPS do time\n" +
                  "• Speed lead (145 SPD)\n" +
                  "• Damage amplifier + control\n" +
                  "**META:** Enabler de DPS através de debuffs"
              },
              {
                name: "🏆 B+ Tier - Daki [Épico]",
                value: "**165 ATK • 900 HP • 125 SPD**\n" +
                  "• Críticos reduzem SPD inimiga AOE (stackável)\n" +
                  "• Ultimate: -35% SPD, -25% ATK, bleed\n" +
                  "• Speed manipulation\n" +
                  "• Budget option\n" +
                  "**META:** Controla velocidade do campo"
              }
            )
            .setFooter({ text: "💚 Support Tier List • O time é mais forte junto" });
        }
        
        // Melhor Custo-Benefício
        else if (category === "budget") {
          metaEmbed = new EmbedBuilder()
            .setTitle("🔰 MELHOR CUSTO-BENEFÍCIO - F2P Friendly")
            .setColor(0xE67E22)
            .setDescription("**Personagens Raros/Épicos que competem com Lendários/Míticos.**\n\n")
            .addFields(
              {
                name: "🥇 S Tier - Satoru Gojo [RARO Control]",
                value: "**Por que é budget META:**\n" +
                  "• Raro mas tem poder de Mítico\n" +
                  "• Melhor controle do jogo\n" +
                  "• 40% evasão = survivability insana\n" +
                  "• Unlimited Void quebrado\n" +
                  "**Acessibilidade:** Fácil de conseguir, difícil de masterizar"
              },
              {
                name: "🥈 A+ Tier - Asta [RARO DPS]",
                value: "**Por que é budget META:**\n" +
                  "• Anti-Magia: IMUNE A DEBUFFS\n" +
                  "• Hard counter de buffers\n" +
                  "• Remove todos buffs/shields\n" +
                  "• +25% dano por buff removido\n" +
                  "**Acessibilidade:** Counter pick perfeito, nicho poderoso"
              },
              {
                name: "🥉 A Tier - Itachi [ÉPICO DPS]",
                value: "**Por que é budget META:**\n" +
                  "• +20% crit chance permanente\n" +
                  "• Amaterasu irremovível\n" +
                  "• Burn 80 por 6 turnos amplificado\n" +
                  "• DoT king\n" +
                  "**Acessibilidade:** Épico acessível, build simples"
              },
              {
                name: "🏆 B+ Tier - Meliodas Base [ÉPICO DPS]",
                value: "**Por que é budget META:**\n" +
                  "• Full Counter: 35% reflect 120% dano\n" +
                  "• Revenge Counter 3.5x → 5.2x scaled\n" +
                  "• Counter fighter único\n" +
                  "• Forte vs burst damage\n" +
                  "**Acessibilidade:** Épico starter friendly"
              },
              {
                name: "💎 B Tier - Daki [ÉPICO Control]",
                value: "**Por que é budget META:**\n" +
                  "• Speed manipulation stackável\n" +
                  "• AOE debuffs múltiplos\n" +
                  "• Épico com utility boa\n" +
                  "• Team support budget\n" +
                  "**Acessibilidade:** Fácil de buildar, simples de usar"
              }
            )
            .setFooter({ text: "🔰 Budget Tier List • Você não precisa de Míticos para vencer!" });
        }
        
        // Broken/OP
        else if (category === "broken") {
          metaEmbed = new EmbedBuilder()
            .setTitle("🌟 BROKEN/OP - Personagens Quebrados")
            .setColor(0xFF00FF)
            .setDescription("**Personagens que ultrapassam os limites do balanceamento.**\n\n")
            .addFields(
              {
                name: "⚡ TIER GOD - Itachi (Susanoo)",
                value: "**Por que é QUEBRADO:**\n" +
                  "• Totsuka Blade: debuffs com duration 999 (PERMANENTE)\n" +
                  "• -60% ALL STATS pelo RESTO DA BATALHA\n" +
                  "• Boss literalmente fica inútil para sempre\n" +
                  "• Não tem counter play\n" +
                  "**Nerf necessário?** Provavelmente, mas é fiel ao anime"
              },
              {
                name: "⚡ TIER GOD - Sukuna (Mahoraga)",
                value: "**Por que é QUEBRADO:**\n" +
                  "• Adaptation mechanic: quanto mais apanha, mais forte fica\n" +
                  "• 60% resistência = quase invulnerável\n" +
                  "• Ultimate 3.0x → 6.0x (100% SCALING!)\n" +
                  "• 1600 HP + 200 DEF = nunca morre\n" +
                  "**Nerf necessário?** Sim, mas épico demais"
              },
              {
                name: "⚡ TIER BROKEN - Nakime",
                value: "**Por que é QUEBRADO:**\n" +
                  "• +15 carga POR RODADA para TODO O TIME\n" +
                  "• Time spamma ultimates infinitamente\n" +
                  "• Buffs AOE massivos\n" +
                  "• Não tem downside\n" +
                  "**Nerf necessário?** Reduzir para +10 carga"
              },
              {
                name: "⚡ TIER BROKEN - Gojo",
                value: "**Por que é QUEBRADO:**\n" +
                  "• 40% evasão passiva = untouchable\n" +
                  "• Unlimited Void: stun 2 turnos GARANTIDO\n" +
                  "• RARO mas poder de Mítico\n" +
                  "• RNG pode fazer ele imortal\n" +
                  "**Nerf necessário?** Talvez reduzir evasão para 30%"
              },
              {
                name: "⚡ TIER BROKEN - Meliodas (Assault)",
                value: "**Por que é QUEBRADO:**\n" +
                  "• 2% ATK por 1% HP perdido = 200% ATK EM 1% HP\n" +
                  "• Ultimate scaling infinito\n" +
                  "• One-shot potential insano\n" +
                  "• Glass cannon extremo\n" +
                  "**Nerf necessário?** Cap em 100% bonus"
              }
            )
            .setFooter({ text: "⚡ BROKEN Tier List • Use com responsabilidade" });
        }
        
        else {
          metaEmbed = new EmbedBuilder()
            .setTitle("📊 Categoria META")
            .setColor(0xFFD700)
            .setDescription("Selecione uma categoria no menu acima.");
        }
        
        await interaction.editReply({ embeds: [metaEmbed], components: [row] });
      });
      
      collector.on("end", async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch {}
      });
      
      return;
    }

    // 5.8. /arena - Batalha PvP Adaptativa
    if (commandName === "arena") {
      const difficulty = (interaction.options.getString("dificuldade") as "easy" | "normal" | "hard" | "nightmare") ?? "normal";
      const speed = interaction.options.getString("velocidade") ?? "medium";
      
      const speedMap: Record<string, number> = {
        slow: 1400,
        medium: 800,
        fast: 350
      };
      
      const delay = speedMap[speed];
      
      try {
        const { runAdaptivePvpBattle } = await import("../services/AdaptivePvpService");
        const { createBattleProgressEmbed, createBattleResultEmbed } = await import("./embeds");
        
        let enemyTeamName = "Arena PvP";
        let lastUpdate = 0;
        
        const battleResult = await runAdaptivePvpBattle(
          discordId,
          difficulty,
          async (snapshot) => {
            const now = Date.now();
            if (snapshot.actions.length > 0 && now - lastUpdate < delay) {
              await new Promise((resolve) => setTimeout(resolve, delay - (now - lastUpdate)));
            }
            
            // Usa o mesmo embed da batalha normal
            await interaction.editReply({ 
              embeds: [createBattleProgressEmbed(username, enemyTeamName, snapshot)] 
            });
            lastUpdate = Date.now();
          },
          discordUltimateDecisionProvider(interaction)
        );
        
        // Atualiza o nome do time inimigo após a batalha
        enemyTeamName = `Arena: ${battleResult.enemyTeamName}`;
        
        // Determina resultado baseado na fase
        const isVictory = battleResult.snapshot.phase === "VICTORY";
        
        // Cria embed final usando o embed padrão de batalha
        const finalEmbed = createBattleResultEmbed(
          username,
          enemyTeamName,
          battleResult.snapshot,
          {
            gold: battleResult.rewards.gold,
            xp: battleResult.rewards.xp,
          },
          [] // Sem drops na arena
        );
        
        // Adiciona informações de recompensas de arena
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
        
        finalEmbed.setTitle(
          isVictory ? "🏆 VITÓRIA NA ARENA!" : "💀 DERROTA NA ARENA"
        );
        
        finalEmbed.setDescription(
          `${difficultyEmojis[difficulty]} **Dificuldade:** ${difficultyNames[difficulty]}\n` +
          `⚔️ **Oponente:** ${battleResult.enemyTeamName}\n\n` +
          (finalEmbed.data.description || "")
        );
        
        // Adiciona campo de recompensas de gemas (exclusivo da arena)
        finalEmbed.addFields({
          name: "💎 Recompensas Extras da Arena",
          value: `• **Gemas:** +${battleResult.rewards.gems}\n${isVictory ? "🎉 **Bônus de vitória aplicado!**" : "💰 **Recompensa de consolação (30%)**"}`
        });
        
        await interaction.editReply({ embeds: [finalEmbed] });
        
        // Atualizar progresso de missões e stats
        if (isVictory) {
          try {
            await updateQuestProgress(discordId, "battle_win", 1);
            const { incrementBattlesWon } = await import("../services/RankingService");
            await incrementBattlesWon(discordId, 1);
          } catch (err) {
            console.error("[QUEST/STATS] Failed to update battle_win progress:", err);
          }
        }
        
        // TODO: Aplicar recompensas ao jogador (integrar com EconomyService)
        console.log(`[ARENA] ${isVictory ? "VICTORY" : "DEFEAT"} - Rewards: ${battleResult.rewards.gold}G, ${battleResult.rewards.gems}💎, ${battleResult.rewards.xp}XP`);
        
      } catch (error: any) {
        console.error("❌ [ARENA ERROR]", error);
        await interaction.editReply(`❌ Erro na arena: ${error.message}`).catch(() => {});
      }
      
      return;
    }

    // 5.9. /equipamento - Gerenciar equipamentos
    if (commandName === "equipamento") {
      const subcommand = interaction.options.getSubcommand();
      
      try {
        const profile = await getProfile(discordId);
        if (!profile) {
          await interaction.editReply("❌ Perfil não encontrado. Use `/perfil` primeiro!");
          return;
        }
        
        // SUBCOMANDO: equipar
        if (subcommand === "equipar") {
          const characterInput = interaction.options.getString("personagem", true);
          const equipmentInput = interaction.options.getString("equipamento", true);
          
          // Buscar personagem do usuário
          const userChar = profile.collection.find(
            c => c.ownedId === characterInput || 
                 c.character.name.toLowerCase() === characterInput.toLowerCase()
          );
          
          if (!userChar) {
            await interaction.editReply("❌ Personagem não encontrado na sua coleção!");
            return;
          }
          
          // Buscar equipamento do usuário
          const userEquipments = await equipmentService.listUserEquipment(profile.user.id);
          const userEquip = userEquipments.find(
            e => e.id === equipmentInput ||
                 e.equipment.name.toLowerCase() === equipmentInput.toLowerCase()
          );
          
          if (!userEquip) {
            await interaction.editReply("❌ Equipamento não encontrado no seu inventário!");
            return;
          }
          
          // Tentar equipar
          await equipmentService.equipItem(userChar.ownedId, userEquip.id);
          
          const embed = createEquipmentEquippedEmbed(userChar.character.name, userEquip.equipment);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
        // SUBCOMANDO: remover
        if (subcommand === "remover") {
          const characterInput = interaction.options.getString("personagem", true);
          
          // Buscar personagem do usuário
          const userChar = profile.collection.find(
            c => c.ownedId === characterInput || 
                 c.character.name.toLowerCase() === characterInput.toLowerCase()
          );
          
          if (!userChar) {
            await interaction.editReply("❌ Personagem não encontrado na sua coleção!");
            return;
          }
          
          // Buscar equipamento equipado
          const equipped = await equipmentService.getEquippedItem(userChar.ownedId);
          
          if (!equipped) {
            await interaction.editReply(`❌ **${userChar.character.name}** não tem nenhum equipamento equipado!`);
            return;
          }
          
          // Remover equipamento
          await equipmentService.unequipItem(userChar.ownedId);
          
          const embed = createEquipmentUnequippedEmbed(userChar.character.name, equipped.equipment.name);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
        // SUBCOMANDO: inventario
        if (subcommand === "inventario") {
          const filter = (interaction.options.getString("filtro") as "all" | "equipped" | "available") ?? "all";
          
          const userEquipments = await equipmentService.listUserEquipment(profile.user.id);
          
          const embed = createEquipmentInventoryEmbed(userEquipments, filter);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
        // SUBCOMANDO: catalogo
        if (subcommand === "catalogo") {
          const type = interaction.options.getString("tipo") ?? "all";
          const rarity = interaction.options.getString("raridade");
          
          let equipments = await equipmentService.listCatalog();
          
          // Filtrar por tipo
          if (type !== "all") {
            equipments = equipments.filter(e => e.equipableType === type);
          }
          
          // Filtrar por raridade
          if (rarity) {
            equipments = equipments.filter(e => e.rarity === rarity);
          }
          
          const embed = createEquipmentCatalogEmbed(equipments, 1, 10);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
        // SUBCOMANDO: info
        if (subcommand === "info") {
          const name = interaction.options.getString("nome", true);
          
          const equip = await equipmentService.findEquipmentByName(name);
          
          if (!equip) {
            await interaction.editReply(`❌ Equipamento **${name}** não encontrado!`);
            return;
          }
          
          const embed = createEquipmentDetailsEmbed(equip);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
      } catch (error: any) {
        console.error("❌ [EQUIPMENT ERROR]", error);
        await interaction.editReply(`❌ Erro: ${error.message}`).catch(() => {});
      }
      
      return;
    }

    // 5.10. /loja - Loja de Loot Boxes
    if (commandName === "loja") {
      try {
        const profile = await getProfile(discordId);
        if (!profile) {
          await interaction.editReply("❌ Perfil não encontrado. Use `/perfil` primeiro!");
          return;
        }
        
        // Buscar contadores de pity
        const pityCounters: Record<string, number> = {};
        const boxTypes: Array<"basic" | "advanced" | "epic" | "legendary" | "mythic"> = 
          ["basic", "advanced", "epic", "legendary", "mythic"];
        
        for (const boxType of boxTypes) {
          const pity = await lootBoxService.getPity(profile.user.id, boxType);
          pityCounters[boxType] = pity.counter;
        }
        
        // Verificar caixa grátis diária
        const canClaimDaily = await lootBoxService.canClaimDailyFreeBox(profile.user.id);
        
        const embed = createLootBoxShopEmbed(profile.user.gems, pityCounters, canClaimDaily);
        await interaction.editReply({ embeds: [embed] });
        
      } catch (error: any) {
        console.error("❌ [LOJA ERROR]", error);
        await interaction.editReply(`❌ Erro: ${error.message}`).catch(() => {});
      }
      
      return;
    }

    // 5.11. /lootbox - Gerenciar loot boxes
    if (commandName === "lootbox") {
      const subcommand = interaction.options.getSubcommand();
      
      try {
        const profile = await getProfile(discordId);
        if (!profile) {
          await interaction.editReply("❌ Perfil não encontrado. Use `/perfil` primeiro!");
          return;
        }
        
        // SUBCOMANDO: abrir
        if (subcommand === "abrir") {
          const boxType = interaction.options.getString("tipo", true) as "basic" | "advanced" | "epic" | "legendary" | "mythic";
          const quantity = interaction.options.getInteger("quantidade") || 1;
          
          // Confirmar compra se quantidade > 1
          if (quantity > 1) {
            const prices = {
              basic: 50,
              advanced: 150,
              epic: 400,
              legendary: 1000,
              mythic: 2500
            };
            
            const totalCost = prices[boxType] * quantity;
            
            await interaction.editReply(
              `💎 Você está prestes a comprar **${quantity}x ${boxType}** por **${totalCost} Gemas**.\n` +
              `Seu saldo: ${profile.user.gems} 💎\n\n` +
              "Abrindo caixas..."
            );
          }
          
          // Abrir múltiplas caixas
          const results = [];
          
          for (let i = 0; i < quantity; i++) {
            try {
              const result = await lootBoxService.openLootBox(profile.user.id, boxType);
              results.push(result);
              
              // Delay entre aberturas para não sobrecarregar
              if (i < quantity - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (error: any) {
              await interaction.editReply(`❌ Erro na caixa ${i + 1}: ${error.message}`);
              return;
            }
          }
          
          // Mostra resultados
          if (results.length === 1) {
            // Uma caixa: Mostra embed detalhado
            const embed = createLootBoxOpeningEmbed(
              boxType,
              results[0].rewards,
              results[0].jackpot,
              results[0].pityTriggered
            );
            await interaction.editReply({ embeds: [embed] });
          } else {
            // Múltiplas caixas: Resume todas
            const allRewards: any[] = [];
            let jackpotCount = 0;
            
            for (const result of results) {
              allRewards.push(...result.rewards);
              if (result.jackpot) jackpotCount++;
            }
            
            const embed = createLootBoxOpeningEmbed(boxType, allRewards, jackpotCount > 0, false);
            
            if (jackpotCount > 0) {
              embed.setDescription(
                `🎰 **${jackpotCount}x JACKPOT!** 🎰\n` +
                `Você abriu **${quantity} caixas** e teve sorte!\n\n` +
                (embed.data.description || "")
              );
            } else {
              embed.setDescription(
                `📦 Você abriu **${quantity} caixas**!\n\n` +
                (embed.data.description || "")
              );
            }
            
            await interaction.editReply({ embeds: [embed] });
          }
          
          return;
        }
        
        // SUBCOMANDO: historico
        if (subcommand === "historico") {
          const history = await lootBoxService.getHistory(profile.user.id, 20);
          const stats = await lootBoxService.getStats(profile.user.id);
          
          const embed = createLootBoxHistoryEmbed(history, stats);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
        // SUBCOMANDO: diaria
        if (subcommand === "diaria") {
          const canClaim = await lootBoxService.canClaimDailyFreeBox(profile.user.id);
          
          if (!canClaim) {
            await interaction.editReply("❌ Você já reivindicou sua caixa grátis hoje! Volte em 24h.");
            return;
          }
          
          const freeEmbed = createDailyFreeBoxEmbed();
          await interaction.editReply({ embeds: [freeEmbed] });
          
          // Delay para criar suspense
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Reivindica e abre
          const result = await lootBoxService.claimDailyFreeBox(profile.user.id);
          
          const embed = createLootBoxOpeningEmbed("basic", result.rewards, false, false);
          embed.setTitle("🎁 Caixa Grátis Diária");
          embed.setDescription("✅ Sua recompensa diária:\n\n" + (embed.data.description || ""));
          
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
        // SUBCOMANDO: aplicar-xp
        if (subcommand === "aplicar-xp") {
          const characterInput = interaction.options.getString("personagem", true);
          
          // TODO: Implementar sistema de XP acumulado
          // Por enquanto, apenas mensagem
          await interaction.editReply(
            "⚠️ Sistema de XP de Maestria acumulado ainda não está implementado!\n\n" +
            "Em breve você poderá:\n" +
            "• Acumular XP de Maestria de loot boxes\n" +
            "• Aplicar em personagens da sua equipe\n" +
            "• Subir múltiplos níveis de maestria de uma vez"
          );
          return;
        }
        
      } catch (error: any) {
        console.error("❌ [LOOTBOX ERROR]", error);
        await interaction.editReply(`❌ Erro: ${error.message}`).catch(() => {});
      }
      
      return;
    }

    // 6. /equipe
    if (commandName === "equipe") {
      const subcommand = interaction.options.getSubcommand();
      let teamData = await getTeam(discordId);

      if (subcommand === "ver") {
        const embed = createTeamEmbed(username, teamData?.team, teamData?.members ?? []);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === "adicionar") {
        const characterId = interaction.options.getString("personagem_id", true);
        const currentMembers = teamData?.members.map((m: OwnedCharacterChoiceSource) => m.ownedId) ?? [];
        if (currentMembers.includes(characterId)) {
          await interaction.editReply("⚠️ Este personagem já está na sua equipe.");
          return;
        }
        if (currentMembers.length >= 5) {
          await interaction.editReply("⚠️ Sua equipe já está cheia (máximo de 5 membros).");
          return;
        }

        const newTeamIds = [...currentMembers, characterId];
        teamData = await replaceTeam(discordId, "Equipe Principal", newTeamIds);
        const embed = createTeamEmbed(username, teamData?.team, teamData?.members ?? []);
        await interaction.editReply({ content: "✅ Personagem adicionado com sucesso!", embeds: [embed] });
        return;
      }

      if (subcommand === "remover") {
        const characterId = interaction.options.getString("personagem_id", true);
        const currentMembers = teamData?.members.map((m: OwnedCharacterChoiceSource) => m.ownedId) ?? [];
        const newTeamIds = currentMembers.filter((id: string) => id !== characterId);

        teamData = await replaceTeam(discordId, "Equipe Principal", newTeamIds);
        const embed = createTeamEmbed(username, teamData?.team, teamData?.members ?? []);
        await interaction.editReply({ content: "✅ Personagem removido da equipe com sucesso!", embeds: [embed] });
        return;
      }

      if (subcommand === "mover") {
        const characterId = interaction.options.getString("personagem_id", true);
        const targetPosition = interaction.options.getInteger("posicao", true);
        const currentMembers = teamData?.members.map((member: OwnedCharacterChoiceSource) => member.ownedId) ?? [];

        if (!currentMembers.includes(characterId)) {
          await interaction.editReply("❌ Selecione um personagem que já esteja na sua equipe. Use `/equipe ver` para conferir os IDs possuídos.");
          return;
        }
        if (targetPosition < 1 || targetPosition > currentMembers.length) {
          await interaction.editReply(`❌ Posição inválida. Informe um número entre 1 e ${currentMembers.length}.`);
          return;
        }

        const newTeamIds = currentMembers.filter((id: string) => id !== characterId);
        newTeamIds.splice(targetPosition - 1, 0, characterId);

        teamData = await replaceTeam(discordId, "Equipe Principal", newTeamIds);
        const embed = createTeamEmbed(username, teamData?.team, teamData?.members ?? []);
        await interaction.editReply({ content: "✅ Personagem movido com sucesso!", embeds: [embed] });
        return;
      }

      if (subcommand === "ordenar") {
        const rawIds = interaction.options.getString("ids", true);
        const orderedIds = rawIds.split(",").map((s) => s.trim()).filter(Boolean);
        const currentMembers = teamData?.members.map((member: OwnedCharacterChoiceSource) => member.ownedId) ?? [];
        const currentMemberSet = new Set(currentMembers);
        const uniqueOrderedIds = new Set(orderedIds);

        if (orderedIds.length !== currentMembers.length) {
          await interaction.editReply(`❌ Informe exatamente ${currentMembers.length} IDs possuídos, separados por vírgula. Use \`/equipe ver\` para copiar os IDs atuais ou \`/equipe mover\` para alterar uma posição por vez.`);
          return;
        }
        if (uniqueOrderedIds.size !== orderedIds.length) {
          await interaction.editReply("❌ A lista contém IDs repetidos. Use cada ID possuído da equipe exatamente uma vez.");
          return;
        }
        if (orderedIds.some((id) => !currentMemberSet.has(id))) {
          await interaction.editReply("❌ Todos os IDs devem pertencer à equipe atual. Use `/equipe ver` para conferir a lista numerada com IDs possuídos.");
          return;
        }

        teamData = await replaceTeam(discordId, "Equipe Principal", orderedIds);
        const embed = createTeamEmbed(username, teamData?.team, teamData?.members ?? []);
        await interaction.editReply({ content: "✅ Ordem da equipe atualizada com sucesso!", embeds: [embed] });
        return;
      }
    }

    // 7. /batalha
    if (commandName === "batalha") {
      try {
        const stageId = interaction.options.getString("estagio_id") ?? undefined;
        const selectedStage = stageId ? await getPveStageById(stageId) : null;
        const stageName = selectedStage?.name ?? (stageId ? `Estágio ${stageId.slice(0, 8)}` : "Mundo 1: Fase Inicial");
        const animationSpeed = interaction.options.getString("velocidade") ?? "slow";
        const delayBySpeed: Record<string, number> = { slow: 1400, medium: 800, fast: 350 };
        const animationDelay = delayBySpeed[animationSpeed] ?? delayBySpeed.slow;
        let lastUpdate = 0;

        const { result, rewards, drops } = await runPlayerBattle(discordId, stageId, async (snapshot) => {
          const now = Date.now();
          if (snapshot.actions.length > 0 && now - lastUpdate < animationDelay) {
            await new Promise((resolve) => setTimeout(resolve, animationDelay - (now - lastUpdate)));
          }
          await interaction.editReply({ embeds: [createBattleProgressEmbed(username, stageName, snapshot)] });
          lastUpdate = Date.now();
        });

        const embed = createBattleResultEmbed(username, stageName, result, rewards, drops);
        await interaction.editReply({ embeds: [embed] });
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        
        if (errorMsg.includes("Profile not found")) {
          await interaction.editReply(
            "❌ **Perfil não encontrado!**\n\n" +
            "Você precisa criar seu perfil primeiro.\n" +
            "Use o comando `/perfil` para começar sua jornada!"
          );
        } else if (errorMsg.includes("No characters in collection")) {
          await interaction.editReply(
            "❌ **Nenhum personagem na coleção!**\n\n" +
            "Você precisa invocar personagens primeiro.\n" +
            "Use o comando `/invocar` para obter seus primeiros personagens!"
          );
        } else if (errorMsg.includes("Create a team")) {
          await interaction.editReply(
            "❌ **Time não configurado!**\n\n" +
            "Você precisa montar um time primeiro.\n" +
            "Use o comando `/time` para configurar sua equipe!"
          );
        } else {
          throw error; // Re-throw outros erros
        }
      }
      return;
    }

    // 8. /missoes
    if (commandName === "missoes") {
      await interaction.deferReply();
      const category = (interaction.options.getString("categoria") ?? "daily") as "daily" | "weekly" | "story";

      const questsList = await getUserQuests(discordId, category);
      
      // Emojis por categoria
      const categoryEmojis: Record<string, string> = {
        daily: "📅",
        weekly: "📆",
        story: "📖",
        monthly: "🗓️",
        event: "🎉",
      };

      const categoryNames: Record<string, string> = {
        daily: "Diárias",
        weekly: "Semanais",
        story: "História",
        monthly: "Mensais",
        event: "Eventos",
      };

      const categoryColors: Record<string, number> = {
        daily: 0x3498db,    // Azul
        weekly: 0x9b59b6,   // Roxo
        story: 0xe67e22,    // Laranja
        monthly: 0xe74c3c,  // Vermelho
        event: 0xf1c40f,    // Amarelo
      };

      // Separar missões por status
      const completed = questsList.filter((q) => q.userQuest.completed && !q.userQuest.claimedAt);
      const claimed = questsList.filter((q) => q.userQuest.claimedAt);
      const inProgress = questsList.filter((q) => !q.userQuest.completed);

      const emoji = categoryEmojis[category] || "📜";
      const categoryName = categoryNames[category] || category.toUpperCase();
      const color = categoryColors[category] || 0x3498db;

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} Missões ${categoryName}`)
        .setColor(color)
        .setDescription(
          `📊 **Progresso:** ${completed.length + claimed.length}/${questsList.length} completas\n` +
          `🎁 **Prontas:** ${completed.length} | ⏳ **Em progresso:** ${inProgress.length} | ✅ **Resgatadas:** ${claimed.length}`
        );

      // Missões prontas para resgatar
      if (completed.length > 0) {
        let text = "";
        for (const q of completed.slice(0, 3)) { // Mostrar até 3
          const quest = q.quest;
          const rewards = `💰 ${quest.rewardGold}G | 💎 ${quest.rewardGems} | 🎫 ${quest.rewardTickets}`;
          text += `🎁 **${quest.title}**\n${quest.description}\n${rewards}\nID: \`${quest.id}\`\n\n`;
        }
        embed.addFields({ name: "🎁 Prontas para Resgatar", value: text || "Nenhuma" });
      }

      // Missões em progresso
      if (inProgress.length > 0) {
        let text = "";
        for (const q of inProgress.slice(0, 4)) { // Mostrar até 4
          const quest = q.quest;
          const uq = q.userQuest;
          const percentage = Math.round((uq.progress / quest.requirementCount) * 100);
          const progressBar = createProgressBar(uq.progress, quest.requirementCount);
          text += `⏳ **${quest.title}** (${percentage}%)\n${progressBar} ${uq.progress}/${quest.requirementCount}\n`;
        }
        embed.addFields({ name: "⏳ Em Progresso", value: text || "Nenhuma" });
      }

      // Missões resgatadas (resumo)
      if (claimed.length > 0) {
        embed.addFields({ 
          name: "✅ Resgatadas", 
          value: `Você já resgatou ${claimed.length} missão(ões) nesta categoria!` 
        });
      }

      if (questsList.length === 0) {
        embed.setDescription("❌ Nenhuma missão disponível nesta categoria.");
      }

      embed.setFooter({ text: "💡 Use os botões abaixo para resgatar ou trocar de categoria" });

      // Botões de categoria
      const categoryRow = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`quests_cat:daily`)
          .setLabel("📅 Diárias")
          .setStyle(category === "daily" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "daily"),
        new ButtonBuilder()
          .setCustomId(`quests_cat:weekly`)
          .setLabel("📆 Semanais")
          .setStyle(category === "weekly" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "weekly"),
        new ButtonBuilder()
          .setCustomId(`quests_cat:story`)
          .setLabel("📖 História")
          .setStyle(category === "story" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "story")
      );

      // Botão de resgatar todas (se houver prontas)
      const components: any[] = [categoryRow];
      if (completed.length > 0) {
        const claimRow = new ActionRowBuilder<any>().addComponents(
          new ButtonBuilder()
            .setCustomId(`quests_claim_all:${category}`)
            .setLabel(`🎁 Resgatar Todas (${completed.length})`)
            .setStyle(ButtonStyle.Primary)
        );
        components.push(claimRow);
      }

      await interaction.editReply({ embeds: [embed], components });
      return;
    }

    // 9. /inventario
    if (commandName === "inventario") {
      await interaction.deferReply();
      const invData = await getUserInventory(discordId);
      const embed = createInventoryEmbed(username, invData);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 10. /diario
    if (commandName === "diario") {
      await interaction.deferReply();
      const action = interaction.options.getString("acao") ?? "ver";

      if (action === "resgatar") {
        const idempotencyKey = `bot_daily_${discordId}_${new Date().toISOString().slice(0, 10)}`;
        const res = await claimDailyReward(discordId, idempotencyKey);
        await interaction.editReply(
          `📅 **Recompensa Diária Resgatada!**\n• Sequência: **${res.streak} dias**\n• Gold: +${res.reward.gold}\n• Gemas: +${res.reward.gems}\n• Tickets: +${res.reward.tickets}`
        );
        return;
      }

      const status = await getDailyRewardStatus(discordId);
      const claimText = status.canClaim ? "🟢 Disponível para resgate hoje!" : "🔴 Já resgatado hoje. Volte amanhã!";
      await interaction.editReply(
        `📅 **Status Diário de ${username}**\n• Sequência de Dias: **${status.currentStreak}**\n• Status: ${claimText}`
      );
      return;
    }

    // 11. /ranking
    if (commandName === "ranking") {
      await interaction.deferReply();
      const category = interaction.options.getString("categoria") ?? "gold";

      // Emojis e nomes por categoria
      const categoryData: Record<string, { emoji: string; name: string; unit: string; color: number }> = {
        gold: { emoji: "💰", name: "Ouro", unit: "G", color: 0xf1c40f },
        gems: { emoji: "💎", name: "Gemas", unit: "💎", color: 0x9b59b6 },
        power: { emoji: "⚔️", name: "Poder da Equipe", unit: "⚡", color: 0xe74c3c },
        battles: { emoji: "🏆", name: "Batalhas Vencidas", unit: "vitórias", color: 0x2ecc71 },
        summons: { emoji: "🎴", name: "Invocações", unit: "summons", color: 0x3498db },
        collection: { emoji: "📚", name: "Coleção", unit: "personagens", color: 0xe67e22 },
        pve: { emoji: "🗺️", name: "PvE Completado", unit: "fases", color: 0x1abc9c },
      };

      const data = categoryData[category] || categoryData.gold;

      let entries: RankingEntry[] = [];
      
      switch (category) {
        case "gold":
          entries = await import("../services/RankingService").then(m => m.getGoldLeaderboard(10));
          break;
        case "gems":
          entries = await import("../services/RankingService").then(m => m.getGemsLeaderboard(10));
          break;
        case "power":
          entries = await getTeamPowerLeaderboard(10);
          break;
        case "battles":
          entries = await import("../services/RankingService").then(m => m.getBattlesWonLeaderboard(10));
          break;
        case "summons":
          entries = await import("../services/RankingService").then(m => m.getSummonsLeaderboard(10));
          break;
        case "collection":
          entries = await getCollectionLeaderboard(10);
          break;
        case "pve":
          entries = await getPveLeaderboard(10);
          break;
        default:
          entries = await import("../services/RankingService").then(m => m.getGoldLeaderboard(10));
      }

      // Encontrar posição do usuário atual
      let userRank = entries.findIndex(e => e.discordId === discordId) + 1;

      const embed = new EmbedBuilder()
        .setTitle(`${data.emoji} Ranking - ${data.name}`)
        .setColor(data.color)
        .setDescription(
          `🏅 **Top 10 Jogadores**\n` +
          (userRank > 0 ? `📍 **Sua posição:** #${userRank}\n` : `📍 Você ainda não está no ranking\n`) +
          `━━━━━━━━━━━━━━━━━━━━`
        );

      if (entries.length === 0) {
        embed.addFields({
          name: "❌ Ranking Vazio",
          value: "Ainda não há jogadores nesta categoria.",
        });
      } else {
        let rankingText = "";
        
        for (const entry of entries) {
          const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
          const isCurrentUser = entry.discordId === discordId;
          const highlight = isCurrentUser ? "**" : "";
          
          let scoreText = "";
          switch (category) {
            case "gold":
              scoreText = `${entry.score.toLocaleString()} G`;
              break;
            case "gems":
              scoreText = `${entry.score.toLocaleString()} 💎`;
              break;
            case "power":
              scoreText = `${entry.score.toLocaleString()} ⚡`;
              break;
            case "battles":
              scoreText = `${entry.score} vitórias`;
              break;
            case "summons":
              scoreText = `${entry.score} summons`;
              break;
            case "collection":
              scoreText = `${entry.score} personagens`;
              break;
            case "pve":
              scoreText = `${entry.score} fases`;
              break;
          }
          
          rankingText += `${medal} ${highlight}${entry.username}${highlight}\n   ${data.emoji} ${scoreText}\n\n`;
        }
        
        embed.addFields({
          name: "🏆 Classificação",
          value: rankingText || "Vazio",
        });
      }

      embed.setFooter({ text: "💡 Use os botões para trocar de categoria" });

      // Botões de categoria (row 1)
      const categoryRow1 = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ranking:gold`)
          .setLabel("💰 Ouro")
          .setStyle(category === "gold" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "gold"),
        new ButtonBuilder()
          .setCustomId(`ranking:gems`)
          .setLabel("💎 Gemas")
          .setStyle(category === "gems" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "gems"),
        new ButtonBuilder()
          .setCustomId(`ranking:power`)
          .setLabel("⚔️ Poder")
          .setStyle(category === "power" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "power"),
        new ButtonBuilder()
          .setCustomId(`ranking:battles`)
          .setLabel("🏆 Vitórias")
          .setStyle(category === "battles" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "battles")
      );

      // Botões de categoria (row 2)
      const categoryRow2 = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ranking:summons`)
          .setLabel("🎴 Summons")
          .setStyle(category === "summons" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "summons"),
        new ButtonBuilder()
          .setCustomId(`ranking:collection`)
          .setLabel("📚 Coleção")
          .setStyle(category === "collection" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "collection"),
        new ButtonBuilder()
          .setCustomId(`ranking:pve`)
          .setLabel("🗺️ PvE")
          .setStyle(category === "pve" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "pve")
      );

      await interaction.editReply({ embeds: [embed], components: [categoryRow1, categoryRow2] });
      return;
    }

    // 12. /historico
    if (commandName === "historico") {
      await interaction.deferReply();
      const type = interaction.options.getString("tipo") ?? "invocacoes";

      if (type === "invocacoes") {
        const history = await getSummonHistory(discordId);
        const embed = new EmbedBuilder().setTitle(`📜 Histórico de Invocações de ${username}`).setColor(0x9b59b6);

        if (!history.length) {
          embed.setDescription("Nenhum histórico de invocação encontrado.");
        } else {
          let text = "";
          for (let i = 0; i < Math.min(history.length, 5); i += 1) {
            const h = history[i];
            text += `• **Qtd:** ${h.quantity} | **Custo:** ${h.cost} ${h.currency} | **Data:** ${new Date(h.createdAt).toLocaleString("pt-BR")}\n`;
          }
          embed.setDescription(text);
        }
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (type === "transacoes") {
        const history = await getTransactionHistory(discordId, 5);
        const embed = new EmbedBuilder().setTitle(`💳 Histórico de Transações Econômicas`).setColor(0xf1c40f);

        if (!history.length) {
          embed.setDescription("Nenhuma transação registrada.");
        } else {
          let text = "";
          for (const tx of history) {
            const sign = tx.amount >= 0 ? "+" : "";
            text += `• **${tx.currency.toUpperCase()}**: ${sign}${tx.amount} (${tx.type}) — *${tx.source}*\n`;
          }
          embed.setDescription(text);
        }
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (type === "batalhas") {
        const battlesList = await listPlayerBattles(discordId);
        const embed = new EmbedBuilder().setTitle(`⚔️ Histórico de Batalhas`).setColor(0xe74c3c);

        if (!battlesList || !battlesList.length) {
          embed.setDescription("Nenhuma batalha travada até o momento.");
        } else {
          let text = "";
          for (const b of battlesList.slice(-5)) {
            text += `• **Resultado:** ${b.status.toUpperCase()} | **Rodadas:** ${b.round} | **Gold:** +${b.rewards.gold}\n`;
          }
          embed.setDescription(text);
        }
        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    // 13. /admin
    if (commandName === "admin") {
      await interaction.deferReply();
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "character") {
        const anime = interaction.options.getString("anime", true);
        const name = interaction.options.getString("nome", true);
        const rarity = interaction.options.getString("raridade", true) as any;
        const role = interaction.options.getString("funcao", true) as any;
        const baseHp = interaction.options.getInteger("hp", true);
        const baseAttack = interaction.options.getInteger("ataque", true);
        const baseDefense = interaction.options.getInteger("defesa", true);
        const baseSpeed = interaction.options.getInteger("velocidade", true);
        const passive = interaction.options.getString("passiva") ?? undefined;
        const imageUrl = interaction.options.getString("imagem_url") ?? undefined;

        const created = await adminCreateCharacter({ anime, name, rarity, role, baseHp, baseAttack, baseDefense, baseSpeed, passive, imageUrl });
        await interaction.editReply(`✅ **[ADMIN] Personagem Criado:** **${created.name}** (\`${created.id}\`)`);
        return;
      }

      if (subcommand === "banner") {
        const name = interaction.options.getString("nome", true);
        const type = interaction.options.getString("tipo", true) as any;
        const costCurrency = interaction.options.getString("moeda", true) as any;
        const singleCost = interaction.options.getInteger("custo_unico", true);
        const tenCost = interaction.options.getInteger("custo_dez", true);

        const created = await adminCreateBanner({
          name,
          type,
          costCurrency,
          singleCost,
          tenCost,
          rates: { common: 50, uncommon: 30, rare: 13, epic: 5, legendary: 1.8, mythic: 0.2 },
        });
        await interaction.editReply(`✅ **[ADMIN] Banner Criado:** **${created.name}** (\`${created.id}\`)`);
        return;
      }

      if (subcommand === "event") {
        const name = interaction.options.getString("nome", true);
        const description = interaction.options.getString("descricao", true);
        const enemyName = interaction.options.getString("inimigo_nome", true);
        const enemyHp = interaction.options.getInteger("inimigo_hp", true);
        const enemyAttack = interaction.options.getInteger("inimigo_ataque", true);
        const enemyDefense = interaction.options.getInteger("inimigo_defesa", true);
        const enemySpeed = interaction.options.getInteger("inimigo_velocidade", true);
        const rewardGems = interaction.options.getInteger("recompensa_gems") ?? 100;

        const created = await adminCreateEvent({ name, description, enemyName, enemyHp, enemyAttack, enemyDefense, enemySpeed, rewardGems });
        await interaction.editReply(`✅ **[ADMIN] Evento Criado:** **${created.name}** (\`${created.id}\`)`);
        return;
      }

      if (subcommand === "give") {
        const targetUser = interaction.options.getString("usuario", true);
        const gold = interaction.options.getInteger("gold") ?? 0;
        const gems = interaction.options.getInteger("gems") ?? 0;
        const tickets = interaction.options.getInteger("tickets") ?? 0;
        const characterId = interaction.options.getString("personagem_id") ?? undefined;

        await adminGiveResources(targetUser, { gold, gems, tickets, characterId });
        await interaction.editReply(`✅ **[ADMIN] Concedido a ${targetUser}:** Gold: +${gold}, Gems: +${gems}, Tickets: +${tickets}`);
        return;
      }

      if (subcommand === "remove") {
        const targetUser = interaction.options.getString("usuario", true);
        const gold = interaction.options.getInteger("gold") ?? 0;
        const gems = interaction.options.getInteger("gems") ?? 0;
        const tickets = interaction.options.getInteger("tickets") ?? 0;
        const userCharacterId = interaction.options.getString("personagem_id") ?? undefined;

        await adminRemoveResources(targetUser, { gold, gems, tickets, userCharacterId });
        await interaction.editReply(`✅ **[ADMIN] Removido de ${targetUser}:** Gold: -${gold}, Gems: -${gems}, Tickets: -${tickets}`);
        return;
      }

      if (subcommand === "battle") {
        const targetUser = interaction.options.getString("usuario", true);
        await adminClearBattleState(targetUser);
        await interaction.editReply(`✅ **[ADMIN] Estado de Batalha Limpo:** Usuário \`${targetUser}\``);
        return;
      }
    }

    // ========================================
    // RAID COMMAND HANDLER
    // ========================================
    if (commandName === "raid") {
      await handleRaidCommand(interaction, discordId, getProfile);
      return;
    }

    // ========================================
    // BOSS RUSH COMMAND HANDLER
    // ========================================
    if (commandName === "bossrush") {
      await handleBossRushCommand(interaction, discordId);
      return;
    }

    await interaction.reply({ content: "Comando não reconhecido.", ephemeral: true });
  } catch (err: any) {
    logger.error({ err, command: commandName }, "Discord command handler failed");
    const errorMsg = `❌ **Erro:** ${err.message || "Ocorreu um erro ao processar o comando."}`;
    if (interaction.deferred || interaction.replied || typeof interaction.editReply === "function") {
      await interaction.editReply(errorMsg);
    } else if (typeof interaction.reply === "function") {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
}


/**
 * ========================================
 * BUTTON INTERACTION HANDLER
 * ========================================
 */
export async function handleButtonInteraction(interaction: any) {
  const discordId = interaction.user.id;
  const customId = interaction.customId;

  console.log(`[BUTTON] CustomId: "${customId}"`);

  // Botões que não são de raid/chars_page/quests/ranking são tratados por outros mecanismos
  if (!customId.startsWith("raid_") && !customId.startsWith("chars_page:") && !customId.startsWith("quests_") && !customId.startsWith("ranking:")) {
    console.log("[BUTTON] Non-managed button - ignoring (handled by awaitMessageComponent)");
    return;
  }

  // DEFER IMEDIATAMENTE - ANTES DE QUALQUER LÓGICA
  let deferred = false;
  try {
    await interaction.deferUpdate();
    deferred = true;
  } catch (deferError: any) {
    console.error(`[BUTTON] Failed to defer:`, deferError.message);
    // Qualquer erro no defer = interação inválida/duplicada → abortar
    console.log(`[BUTTON] Aborting - interaction invalid (${deferError.code})`);
    return;
  }

  // Helper para responder (usa followUp se defer funcionou, senão ignora)
  const respond = async (options: any) => {
    if (!deferred) {
      console.log(`[BUTTON] Skipping response - interaction expired`);
      return;
    }
    return interaction.followUp(options);
  };

  try {
    // ========================================
    // RANKING HANDLERS
    // ========================================
    if (customId.startsWith("ranking:")) {
      const category = customId.split(":")[1];

      const categoryData: Record<string, { emoji: string; name: string; unit: string; color: number }> = {
        gold: { emoji: "💰", name: "Ouro", unit: "G", color: 0xf1c40f },
        gems: { emoji: "💎", name: "Gemas", unit: "💎", color: 0x9b59b6 },
        power: { emoji: "⚔️", name: "Poder da Equipe", unit: "⚡", color: 0xe74c3c },
        battles: { emoji: "🏆", name: "Batalhas Vencidas", unit: "vitórias", color: 0x2ecc71 },
        summons: { emoji: "🎴", name: "Invocações", unit: "summons", color: 0x3498db },
        collection: { emoji: "📚", name: "Coleção", unit: "personagens", color: 0xe67e22 },
        pve: { emoji: "🗺️", name: "PvE Completado", unit: "fases", color: 0x1abc9c },
      };

      const data = categoryData[category] || categoryData.gold;

      let entries: any[] = [];
      
      const RankingService = await import("../services/RankingService");
      
      switch (category) {
        case "gold":
          entries = await RankingService.getGoldLeaderboard(10);
          break;
        case "gems":
          entries = await RankingService.getGemsLeaderboard(10);
          break;
        case "power":
          entries = await RankingService.getTeamPowerLeaderboard(10);
          break;
        case "battles":
          entries = await RankingService.getBattlesWonLeaderboard(10);
          break;
        case "summons":
          entries = await RankingService.getSummonsLeaderboard(10);
          break;
        case "collection":
          entries = await RankingService.getCollectionLeaderboard(10);
          break;
        case "pve":
          entries = await RankingService.getPveLeaderboard(10);
          break;
      }

      let userRank = entries.findIndex((e: any) => e.discordId === discordId) + 1;

      const embed = new EmbedBuilder()
        .setTitle(`${data.emoji} Ranking - ${data.name}`)
        .setColor(data.color)
        .setDescription(
          `🏅 **Top 10 Jogadores**\n` +
          (userRank > 0 ? `📍 **Sua posição:** #${userRank}\n` : `📍 Você ainda não está no ranking\n`) +
          `━━━━━━━━━━━━━━━━━━━━`
        );

      if (entries.length === 0) {
        embed.addFields({
          name: "❌ Ranking Vazio",
          value: "Ainda não há jogadores nesta categoria.",
        });
      } else {
        let rankingText = "";
        
        for (const entry of entries) {
          const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
          const isCurrentUser = entry.discordId === discordId;
          const highlight = isCurrentUser ? "**" : "";
          
          let scoreText = "";
          switch (category) {
            case "gold":
              scoreText = `${entry.score.toLocaleString()} G`;
              break;
            case "gems":
              scoreText = `${entry.score.toLocaleString()} 💎`;
              break;
            case "power":
              scoreText = `${entry.score.toLocaleString()} ⚡`;
              break;
            case "battles":
              scoreText = `${entry.score} vitórias`;
              break;
            case "summons":
              scoreText = `${entry.score} summons`;
              break;
            case "collection":
              scoreText = `${entry.score} personagens`;
              break;
            case "pve":
              scoreText = `${entry.score} fases`;
              break;
          }
          
          rankingText += `${medal} ${highlight}${entry.username}${highlight}\n   ${data.emoji} ${scoreText}\n\n`;
        }
        
        embed.addFields({
          name: "🏆 Classificação",
          value: rankingText || "Vazio",
        });
      }

      embed.setFooter({ text: "💡 Use os botões para trocar de categoria" });

      const categoryRow1 = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ranking:gold`)
          .setLabel("💰 Ouro")
          .setStyle(category === "gold" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "gold"),
        new ButtonBuilder()
          .setCustomId(`ranking:gems`)
          .setLabel("💎 Gemas")
          .setStyle(category === "gems" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "gems"),
        new ButtonBuilder()
          .setCustomId(`ranking:power`)
          .setLabel("⚔️ Poder")
          .setStyle(category === "power" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "power"),
        new ButtonBuilder()
          .setCustomId(`ranking:battles`)
          .setLabel("🏆 Vitórias")
          .setStyle(category === "battles" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "battles")
      );

      const categoryRow2 = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ranking:summons`)
          .setLabel("🎴 Summons")
          .setStyle(category === "summons" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "summons"),
        new ButtonBuilder()
          .setCustomId(`ranking:collection`)
          .setLabel("📚 Coleção")
          .setStyle(category === "collection" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "collection"),
        new ButtonBuilder()
          .setCustomId(`ranking:pve`)
          .setLabel("🗺️ PvE")
          .setStyle(category === "pve" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "pve")
      );

      await interaction.editReply({ embeds: [embed], components: [categoryRow1, categoryRow2] });
      return;
    }

    // ========================================
    // QUESTS HANDLERS
    // ========================================
    if (customId.startsWith("quests_cat:")) {
      const category = customId.split(":")[1] as "daily" | "weekly" | "story";
      
      const questsList = await getUserQuests(discordId, category);
      
      const categoryEmojis: Record<string, string> = {
        daily: "📅",
        weekly: "📆",
        story: "📖",
        monthly: "🗓️",
        event: "🎉",
      };

      const categoryNames: Record<string, string> = {
        daily: "Diárias",
        weekly: "Semanais",
        story: "História",
        monthly: "Mensais",
        event: "Eventos",
      };

      const categoryColors: Record<string, number> = {
        daily: 0x3498db,
        weekly: 0x9b59b6,
        story: 0xe67e22,
        monthly: 0xe74c3c,
        event: 0xf1c40f,
      };

      const completed = questsList.filter((q) => q.userQuest.completed && !q.userQuest.claimedAt);
      const claimed = questsList.filter((q) => q.userQuest.claimedAt);
      const inProgress = questsList.filter((q) => !q.userQuest.completed);

      const emoji = categoryEmojis[category] || "📜";
      const categoryName = categoryNames[category] || category.toUpperCase();
      const color = categoryColors[category] || 0x3498db;

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} Missões ${categoryName}`)
        .setColor(color)
        .setDescription(
          `📊 **Progresso:** ${completed.length + claimed.length}/${questsList.length} completas\n` +
          `🎁 **Prontas:** ${completed.length} | ⏳ **Em progresso:** ${inProgress.length} | ✅ **Resgatadas:** ${claimed.length}`
        );

      if (completed.length > 0) {
        let text = "";
        for (const q of completed.slice(0, 3)) {
          const quest = q.quest;
          const rewards = `💰 ${quest.rewardGold}G | 💎 ${quest.rewardGems} | 🎫 ${quest.rewardTickets}`;
          text += `🎁 **${quest.title}**\n${quest.description}\n${rewards}\nID: \`${quest.id}\`\n\n`;
        }
        embed.addFields({ name: "🎁 Prontas para Resgatar", value: text || "Nenhuma" });
      }

      if (inProgress.length > 0) {
        let text = "";
        for (const q of inProgress.slice(0, 4)) {
          const quest = q.quest;
          const uq = q.userQuest;
          const percentage = Math.round((uq.progress / quest.requirementCount) * 100);
          const progressBar = createProgressBar(uq.progress, quest.requirementCount);
          text += `⏳ **${quest.title}** (${percentage}%)\n${progressBar} ${uq.progress}/${quest.requirementCount}\n`;
        }
        embed.addFields({ name: "⏳ Em Progresso", value: text || "Nenhuma" });
      }

      if (claimed.length > 0) {
        embed.addFields({ 
          name: "✅ Resgatadas", 
          value: `Você já resgatou ${claimed.length} missão(ões) nesta categoria!` 
        });
      }

      if (questsList.length === 0) {
        embed.setDescription("❌ Nenhuma missão disponível nesta categoria.");
      }

      embed.setFooter({ text: "💡 Use os botões abaixo para resgatar ou trocar de categoria" });

      const categoryRow = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`quests_cat:daily`)
          .setLabel("📅 Diárias")
          .setStyle(category === "daily" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "daily"),
        new ButtonBuilder()
          .setCustomId(`quests_cat:weekly`)
          .setLabel("📆 Semanais")
          .setStyle(category === "weekly" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "weekly"),
        new ButtonBuilder()
          .setCustomId(`quests_cat:story`)
          .setLabel("📖 História")
          .setStyle(category === "story" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "story")
      );

      const components: any[] = [categoryRow];
      if (completed.length > 0) {
        const claimRow = new ActionRowBuilder<any>().addComponents(
          new ButtonBuilder()
            .setCustomId(`quests_claim_all:${category}`)
            .setLabel(`🎁 Resgatar Todas (${completed.length})`)
            .setStyle(ButtonStyle.Primary)
        );
        components.push(claimRow);
      }

      await interaction.editReply({ embeds: [embed], components });
      return;
    }

    if (customId.startsWith("quests_claim_all:")) {
      const category = customId.split(":")[1] as "daily" | "weekly" | "story";
      
      const questsList = await getUserQuests(discordId, category);
      const completed = questsList.filter((q) => q.userQuest.completed && !q.userQuest.claimedAt);

      if (completed.length === 0) {
        await respond({ content: "❌ Nenhuma missão pronta para resgatar!", ephemeral: true });
        return;
      }

      let totalGold = 0;
      let totalGems = 0;
      let totalTickets = 0;
      const claimedQuests: string[] = [];

      for (const q of completed) {
        try {
          const idempotencyKey = `bot_quest_${discordId}_${q.quest.id}_${Date.now()}_${Math.random()}`;
          const res = await claimQuestReward(discordId, q.quest.id, idempotencyKey);
          
          totalGold += res.rewards.gold;
          totalGems += res.rewards.gems;
          totalTickets += res.rewards.tickets;
          claimedQuests.push(q.quest.title);
        } catch (error: any) {
          console.error(`Failed to claim quest ${q.quest.id}:`, error);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("🎉 Recompensas Resgatadas!")
        .setColor(0x2ecc71)
        .setDescription(
          `Você resgatou **${claimedQuests.length}** missão(ões)!\n\n` +
          `💰 **Gold:** +${totalGold}\n` +
          `💎 **Gemas:** +${totalGems}\n` +
          `🎫 **Tickets:** +${totalTickets}`
        )
        .addFields({
          name: "📜 Missões Resgatadas",
          value: claimedQuests.map((t) => `✅ ${t}`).join("\n") || "Nenhuma",
        })
        .setFooter({ text: "Continue completando missões para ganhar mais recompensas!" });

      await respond({ embeds: [embed], ephemeral: true });
      
      // Atualizar embed original
      const updatedQuestsList = await getUserQuests(discordId, category);
      const updatedCompleted = updatedQuestsList.filter((q) => q.userQuest.completed && !q.userQuest.claimedAt);
      const updatedClaimed = updatedQuestsList.filter((q) => q.userQuest.claimedAt);
      const updatedInProgress = updatedQuestsList.filter((q) => !q.userQuest.completed);

      const categoryEmojis: Record<string, string> = { daily: "📅", weekly: "📆", story: "📖" };
      const categoryNames: Record<string, string> = { daily: "Diárias", weekly: "Semanais", story: "História" };
      const categoryColors: Record<string, number> = { daily: 0x3498db, weekly: 0x9b59b6, story: 0xe67e22 };

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`${categoryEmojis[category]} Missões ${categoryNames[category]}`)
        .setColor(categoryColors[category])
        .setDescription(
          `📊 **Progresso:** ${updatedCompleted.length + updatedClaimed.length}/${updatedQuestsList.length} completas\n` +
          `🎁 **Prontas:** ${updatedCompleted.length} | ⏳ **Em progresso:** ${updatedInProgress.length} | ✅ **Resgatadas:** ${updatedClaimed.length}`
        );

      if (updatedInProgress.length > 0) {
        let text = "";
        for (const q of updatedInProgress.slice(0, 4)) {
          const quest = q.quest;
          const uq = q.userQuest;
          const percentage = Math.round((uq.progress / quest.requirementCount) * 100);
          const progressBar = createProgressBar(uq.progress, quest.requirementCount);
          text += `⏳ **${quest.title}** (${percentage}%)\n${progressBar} ${uq.progress}/${quest.requirementCount}\n`;
        }
        updatedEmbed.addFields({ name: "⏳ Em Progresso", value: text });
      }

      if (updatedClaimed.length > 0) {
        updatedEmbed.addFields({ 
          name: "✅ Resgatadas", 
          value: `Você já resgatou ${updatedClaimed.length} missão(ões) nesta categoria!` 
        });
      }

      const categoryRow = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`quests_cat:daily`)
          .setLabel("📅 Diárias")
          .setStyle(category === "daily" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "daily"),
        new ButtonBuilder()
          .setCustomId(`quests_cat:weekly`)
          .setLabel("📆 Semanais")
          .setStyle(category === "weekly" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "weekly"),
        new ButtonBuilder()
          .setCustomId(`quests_cat:story`)
          .setLabel("📖 História")
          .setStyle(category === "story" ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(category === "story")
      );

      try {
        await interaction.message.edit({ embeds: [updatedEmbed], components: [categoryRow] });
      } catch (err) {
        console.error("Failed to update quest message:", err);
      }

      return;
    }

    // ========================================
    // CHARACTERS PAGINATION HANDLER
    // ========================================
    if (customId.startsWith("chars_page:")) {
      const parts = customId.split(":");
      const newPage = parseInt(parts[1], 10);
      const animeFilter = parts[2] || undefined;
      const rarityFilter = parts[3] || undefined;

      const profile = await getProfile(discordId);
      const catalog = await listCharacters({ anime: animeFilter, rarity: rarityFilter });

      // Emojis
      const rarityEmojis: Record<string, string> = {
        comum: "⚪",
        raro: "🔵",
        epico: "🟣",
        lendario: "🟡",
        mitico: "🔴",
      };

      const roleEmojis: Record<string, string> = {
        dps: "⚔️",
        tank: "🛡️",
        suporte: "💚",
        support: "💚",
        controle: "🎯",
      };

      const ownedIds = new Set(profile?.collection.map((c: OwnedCharacterChoiceSource) => c.character.id) ?? []);
      const ownedCount = catalog.filter((c) => ownedIds.has(c.id)).length;

      // Ordenar
      const rarityOrder: Record<string, number> = { mitico: 5, lendario: 4, epico: 3, raro: 2, comum: 1 };
      const sorted = [...catalog].sort((a, b) => {
        const aOwned = ownedIds.has(a.id) ? 1 : 0;
        const bOwned = ownedIds.has(b.id) ? 1 : 0;
        if (aOwned !== bOwned) return bOwned - aOwned;
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      });

      // Paginação
      const perPage = 6;
      const totalPages = Math.ceil(sorted.length / perPage);
      const page = Math.max(0, Math.min(newPage, totalPages - 1));

      const start = page * perPage;
      const end = start + perPage;
      const pageCharacters = sorted.slice(start, end);

      // Embed
      let filterText = "";
      if (animeFilter) filterText += `📺 **${animeFilter}**`;
      if (rarityFilter) filterText += (filterText ? " • " : "") + `${rarityEmojis[rarityFilter] || "⭐"} **${rarityFilter.toUpperCase()}**`;

      const embed = new EmbedBuilder()
        .setTitle("🎴 Catálogo de Personagens")
        .setColor(rarityFilter === "mitico" ? 0xff0000 : rarityFilter === "lendario" ? 0xffd700 : rarityFilter === "epico" ? 0x9b59b6 : rarityFilter === "raro" ? 0x3498db : 0x95a5a6)
        .setDescription(
          `${filterText ? `**Filtros:** ${filterText}\n` : ""}` +
          `📊 **Progresso:** ${ownedCount}/${catalog.length} personagens (${Math.round((ownedCount / catalog.length) * 100)}%)\n` +
          `📖 Página ${page + 1}/${totalPages}`
        );

      for (const c of pageCharacters) {
        const owned = ownedIds.has(c.id);
        const rarityEmoji = rarityEmojis[c.rarity] || "⭐";
        const roleEmoji = roleEmojis[c.role.toLowerCase()] || "❓";
        
        const ownedSymbol = owned ? "✅ **POSSUÍDO**" : "🔒 *Não possuído*";
        
        embed.addFields({
          name: `${rarityEmoji} ${c.name} ${roleEmoji}`,
          value:
            `${ownedSymbol}\n` +
            `📺 ${c.anime} • ${c.rarity.toUpperCase()} • ${c.role.toUpperCase()}\n` +
            `💪 HP: ${c.baseHp} | ATK: ${c.baseAttack} | DEF: ${c.baseDefense} | SPD: ${c.baseSpeed}`,
          inline: true,
        });
      }

      if (pageCharacters.length > 0) {
        applyEmbedImage(embed, pageCharacters[0].imageUrl);
      }

      embed.setFooter({ text: "💡 Use /personagem <nome> para ver detalhes completos" });

      // Botões
      const row = new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder()
          .setCustomId(`chars_page:${page - 1}:${animeFilter || ""}:${rarityFilter || ""}`)
          .setLabel("◀️ Anterior")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`chars_page:${page + 1}:${animeFilter || ""}:${rarityFilter || ""}`)
          .setLabel("Próxima ▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= totalPages - 1)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    // ========================================
    // RAID BUTTON HANDLERS
    // ========================================
    if (customId.startsWith("raid_")) {
      // Parse: raid_ACTION:RAID_ID
      const colonIndex = customId.indexOf(":");
      const actionPart = customId.substring(5, colonIndex);
      const raidId = customId.substring(colonIndex + 1);
      
      console.log(`[BUTTON] Action: "${actionPart}", RaidId: "${raidId}"`);

      if (actionPart === "add_char") {
        console.log("[BUTTON] Handling add_char");
        
        const [raidInstance] = await db
          .select()
          .from(raidInstances)
          .where(eq(raidInstances.id, raidId))
          .limit(1);

        if (!raidInstance) {
          await respond({ content: "❌ Raid não encontrada!", ephemeral: true });
          return;
        }

        const raidStatus = await raidService.getRaidStatus(raidInstance.roomCode);
        
        // IDs dos personagens já na raid
        const alreadyAddedIds = new Set(
          raidStatus.teamMembers.map((m: any) => m.userChar.id)
        );
        
        // Buscar personagens do usuário
        const profile = await getProfile(discordId);
        if (!profile || profile.collection.length === 0) {
          await respond({ content: "❌ Você não tem personagens! Use `/invocar` primeiro.", ephemeral: true });
          return;
        }

        // Filtrar personagens já adicionados
        const availableCharacters = profile.collection.filter(
          (item: any) => !alreadyAddedIds.has(item.ownedId)
        );

        if (availableCharacters.length === 0) {
          await respond({ 
            content: "❌ Você já adicionou todos os seus personagens disponíveis!", 
            ephemeral: true 
          });
          return;
        }

        // Criar select menu com personagens disponíveis
        const options = availableCharacters.slice(0, 25).map((item: any) => ({
          label: `${item.character.name} (Nv.${item.level})`,
          description: `${item.character.anime} • ${item.character.rarity}`,
          value: item.ownedId,
        }));

        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`raid_char_select:${raidId}`)
            .setPlaceholder("Escolha um personagem para adicionar")
            .addOptions(options)
        );

        await respond({
          content: `**Selecione um personagem para adicionar à raid:**\n\n📊 Time atual: ${raidStatus.teamMembers.length}/4`,
          components: [selectMenu],
          ephemeral: true,
        });
        return;
      }

      if (actionPart === "status") {
        console.log("[BUTTON] Handling status");

        const [raidInstance] = await db
          .select()
          .from(raidInstances)
          .where(eq(raidInstances.id, raidId))
          .limit(1);

        if (!raidInstance) {
          await respond({ content: "❌ Raid não encontrada!", ephemeral: true });
          return;
        }

        const status = await raidService.getRaidStatus(raidInstance.roomCode);

        const embed = createRaidRoomEmbed(
          status.raidMap!,
          status.raidInstance.difficulty,
          raidInstance.roomCode,
          status.participants,
          status.teamMembers
        );

        await respond({ embeds: [embed], ephemeral: true });
        return;
      }

      if (actionPart === "start") {
        console.log("[BUTTON] Handling start");
        // Iniciar raid

        const [raidInstance] = await db
          .select()
          .from(raidInstances)
          .where(eq(raidInstances.id, raidId))
          .limit(1);

        if (!raidInstance) {
          await respond({ content: "❌ Raid não encontrada!", ephemeral: true });
          return;
        }

        // Buscar raid map para ter o nome
        const raidMap = getRaidById(raidInstance.raidMapId);
        if (!raidMap) {
          await respond({ content: "❌ Mapa da raid não encontrado!", ephemeral: true });
          return;
        }

        // Buscar user pelo discordId para comparar com leaderId
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.discordId, discordId))
          .limit(1);

        if (!user) {
          await respond({ content: "❌ Usuário não encontrado!", ephemeral: true });
          return;
        }

        // Verificar se é o líder
        if (raidInstance.leaderId !== user.id) {
          await respond({ content: "❌ Apenas o líder pode iniciar a raid!", ephemeral: true });
          return;
        }

        // Verificar se tem pelo menos 1 personagem
        const status = await raidService.getRaidStatus(raidInstance.roomCode);
        if (status.teamMembers.length < 1) {
          await respond({
            content: `❌ Adicione pelo menos 1 personagem antes de iniciar!`,
            ephemeral: true,
          });
          return;
        }

        try {
          // Responder imediatamente (antes de iniciar a batalha, que pode demorar muito)
          await respond({ content: `⚔️ **Iniciando a raid ${raidMap.name}...** Acompanhe a batalha no canal!`, ephemeral: true });

          let battleMessage: any = null;
          let lastUpdate = 0;
          const ANIMATION_DELAY = 1400; // ms entre updates — igual ao modo lento do arena

          // Busca o channel antes de iniciar a batalha (garante que está disponível)
          const channel = interaction.channel
            ?? (await interaction.client.channels.fetch(interaction.channelId).catch(() => null));

          // Função que envia/edita a embed a cada snapshot
          const onWaveSnapshot = async (waveNum: number, totalWaves: number, snap: any, isBoss: boolean) => {
            if (!channel || !(channel as any).isTextBased?.()) return;
            const waveLabel = isBoss
              ? `💀 ${raidMap.name} — Boss`
              : `⚔️ ${raidMap.name} — Wave ${waveNum}/${totalWaves - 1}`;

            const embed = createBattleProgressEmbedStatic(
              `Raid Cooperativa`,
              waveLabel,
              snap,
            );

            const now = Date.now();

            // Aguarda o delay igual ao arena — cria animação suave
            if (lastUpdate > 0 && snap.phase !== "VICTORY" && snap.phase !== "DEFEAT" && snap.phase !== "DRAW") {
              const elapsed = now - lastUpdate;
              if (elapsed < ANIMATION_DELAY) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY - elapsed));
              }
            }

            lastUpdate = Date.now();

            try {
              if (!battleMessage) {
                battleMessage = await (channel as any).send({ embeds: [embed] });
              } else {
                await battleMessage.edit({ embeds: [embed] });
              }
            } catch (err: any) {
              console.error(`[RAID] Failed to update battle embed:`, err?.message ?? err);
            }
          };

          // Iniciar batalha com callback animado
          const result = await raidService.startRaidBattle(raidInstance.id, discordId, onWaveSnapshot);

          const victoryEmoji = result.victory ? "🎉" : "💀";
          const victoryText = result.victory ? "VITÓRIA!" : "DERROTA!";
          const survivorText = result.survivors.filter((s: any) => s.alive).map((s: any) => `• ${s.name} (${s.hp} HP)`).join("\n") || "Nenhum";
          const casualtyText = result.casualties.length > 0 ? result.casualties.join(", ") : "Nenhuma";

          // Mensagem final de resultado no canal
          if (channel && (channel as any).isTextBased?.()) {
            await (channel as any).send({
              content:
                `${victoryEmoji} **RAID ${victoryText}** — ${raidMap.name}\n\n` +
                `⏱️ Tempo: ${result.timeElapsed}s | 🗺️ Wave alcançada: ${result.waveReached}/${result.totalWaves}\n\n` +
                `✅ **Sobreviventes:**\n${survivorText}\n` +
                (result.casualties.length > 0 ? `\n💀 **Baixas:** ${casualtyText}\n` : "") +
                (result.victory ? `\n🏆 Recompensas distribuídas!` : `\n❌ Tente novamente com personagens mais fortes!`),
            }).catch((err: any) => console.error(`[RAID] Result message error:`, err?.message));
          }
        } catch (error: any) {
          await respond({ content: `❌ Erro ao iniciar raid: ${error.message}`, ephemeral: true });
        }
        return;
      }

      if (actionPart === "leave") {
        console.log("[BUTTON] Handling leave");
        // Sair da raid

        try {
          const result = await raidService.leaveRaid(discordId, raidId);

          if (result.cancelled) {
            await respond({ content: "✅ Você (líder) saiu da raid. A sala foi cancelada.", ephemeral: true });
          } else {
            await respond({ content: "✅ Você saiu da raid.", ephemeral: true });
          }
        } catch (error: any) {
          await respond({ content: `❌ ${error.message}`, ephemeral: true });
        }
        return;
      }

      console.log(`[BUTTON] Unknown action: "${actionPart}"`);
      await respond({ content: `❌ Ação desconhecida: ${actionPart}`, ephemeral: true });
      return;
    }

    console.log("[BUTTON] CustomId does not start with raid_");
    // Não deveria chegar aqui pois retornamos antes do try
  } catch (error: any) {
    console.error("❌ [BUTTON INTERACTION ERROR]", error);
    try {
      await respond({ content: `❌ Erro: ${error.message}`, ephemeral: true }).catch(() => {});
    } catch (followUpError) {
      console.error("❌ [BUTTON FOLLOW-UP ERROR]", followUpError);
    }
  }
}


// Simple lock system to prevent duplicate interactions
const interactionLocks = new Map<string, boolean>();

// Additional lock for raid character additions (prevents DB-level duplicates)
const raidAddCharLocks = new Map<string, boolean>();

/**
 * ========================================
 * SELECT MENU INTERACTION HANDLER
 * ========================================
 */
export async function handleSelectMenuInteraction(interaction: any) {
  const discordId = interaction.user.id;
  const customId = interaction.customId;
  const selectedValue = interaction.values[0];

  // Create unique lock key
  const lockKey = `${customId}:${discordId}:${selectedValue}`;
  
  // Check if already processing
  if (interactionLocks.get(lockKey)) {
    console.log(`[SELECT MENU] Duplicate interaction detected, ignoring: ${lockKey}`);
    // Try to acknowledge if not done yet
    try {
      await interaction.deferUpdate().catch(() => {});
    } catch {}
    return;
  }
  
  // Set lock BEFORE defer to prevent race condition
  interactionLocks.set(lockKey, true);

  // DEFER IMEDIATAMENTE - ANTES DE QUALQUER LÓGICA
  let deferred = false;
  try {
    await interaction.deferUpdate();
    deferred = true;
  } catch (deferError: any) {
    console.error(`[SELECT MENU] Failed to defer:`, deferError.message);
    // Qualquer erro no defer = interação inválida/duplicada → abortar
    console.log(`[SELECT MENU] Aborting - interaction invalid (${deferError.code})`);
    interactionLocks.delete(lockKey);
    return;
  }

  // Helper para responder (usa followUp se defer funcionou, senão ignora)
  const respond = async (options: any) => {
    if (!deferred) {
      console.log(`[BUTTON] Skipping response - interaction expired`);
      return;
    }
    return interaction.followUp(options);
  };

  try {
    // ========================================
    // RAID CHARACTER SELECT
    // ========================================
    if (customId.startsWith("raid_char_select:")) {
      const raidId = customId.split(":")[1];
      const ownedCharacterId = selectedValue;

      // Additional lock to prevent duplicate character additions
      const addCharLockKey = `${raidId}:${discordId}:${ownedCharacterId}`;
      
      if (raidAddCharLocks.get(addCharLockKey)) {
        console.log(`[SELECT MENU] Blocked duplicate character addition: ${addCharLockKey}`);
        await respond({
          content: "⏳ Já está processando essa adição. Aguarde...",
          ephemeral: true,
        });
        return;
      }
      
      raidAddCharLocks.set(addCharLockKey, true);
      
      // Auto-release after 10 seconds
      setTimeout(() => raidAddCharLocks.delete(addCharLockKey), 10000);

      try {
        await raidService.addCharacter({
          raidInstanceId: raidId,
          userId: discordId,
          userCharacterId: ownedCharacterId,
        });

        const profile = await getProfile(discordId);
        const character = profile.collection.find((c: any) => c.ownedId === ownedCharacterId);

        // Buscar raid instance para pegar roomCode
        const [raidInstance] = await db
          .select()
          .from(raidInstances)
          .where(eq(raidInstances.id, raidId))
          .limit(1);

        let teamCount = 1; // default
        
        if (raidInstance) {
          // Buscar status atualizado
          const status = await raidService.getRaidStatus(raidInstance.roomCode);
          teamCount = status.teamMembers.length;
          
          // Atualizar mensagem original
          const updatedEmbed = createRaidRoomEmbed(
            status.raidMap!,
            status.raidInstance.difficulty,
            raidInstance.roomCode,
            status.participants,
            status.teamMembers
          );
          
          // Atualizar botões
          const canStart = status.teamMembers.length >= 1 && status.raidInstance.status === "waiting";
          
          const row = new ActionRowBuilder<any>().addComponents(
            new ButtonBuilder()
              .setCustomId(`raid_add_char:${raidInstance.id}`)
              .setLabel("➕ Adicionar Personagem")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(status.teamMembers.length >= 4),
            new ButtonBuilder()
              .setCustomId(`raid_status:${raidInstance.id}`)
              .setLabel("📊 Ver Status")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`raid_start:${raidInstance.id}`)
              .setLabel("🚀 Iniciar Raid")
              .setStyle(ButtonStyle.Success)
              .setDisabled(!canStart),
            new ButtonBuilder()
              .setCustomId(`raid_leave:${raidInstance.id}`)
              .setLabel("🚪 Sair")
              .setStyle(ButtonStyle.Danger)
          );
          
          // Sempre atualiza a embed da sala no canal (independente do defer)
          try {
            const channel = interaction.channel
              ?? (await interaction.client.channels.fetch(interaction.channelId).catch(() => null));

            if (channel && (channel as any).isTextBased?.()) {
              await (channel as any).send({
                embeds: [updatedEmbed],
                components: [row]
              });
            }
          } catch (updateError) {
            console.error("Erro ao enviar atualização da sala:", updateError);
          }
        }

        // Responder ao usuário
        await respond({
          content:
            `✅ **${character?.character.name}** foi adicionado à equipe da raid!\n\n` +
            `📊 Time: ${teamCount}/4 personagens`,
          ephemeral: true,
        });
      } catch (error: any) {
        await respond({ content: `❌ ${error.message}`, ephemeral: true }).catch(() => {});
      } finally {
        // Release locks
        raidAddCharLocks.delete(addCharLockKey);
        interactionLocks.delete(lockKey);
      }
      return;
    }

    await respond({ content: "❌ Ação desconhecida!", ephemeral: true });
  } catch (error: any) {
    console.error("❌ [SELECT MENU INTERACTION ERROR]", error);
    try {
      await respond({ content: `❌ Erro: ${error.message}`, ephemeral: true }).catch(() => {});
    } catch (followUpError) {
      console.error("❌ [SELECT MENU FOLLOW-UP ERROR]", followUpError);
    }
  } finally {
    // Release lock in case of unhandled error
    interactionLocks.delete(lockKey);
  }
}
