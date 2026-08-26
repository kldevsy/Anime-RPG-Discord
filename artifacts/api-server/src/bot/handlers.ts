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
import { claimQuestReward, getUserQuests } from "../services/QuestService";
import { claimDailyReward, getDailyRewardStatus } from "../services/DailyRewardService";
import {
  getCollectionLeaderboard,
  getPveLeaderboard,
  getTeamPowerLeaderboard,
  getWealthLeaderboard,
} from "../services/RankingService";
import {
  adminClearBattleState,
  adminCreateBanner,
  adminCreateCharacter,
  adminCreateEvent,
  adminGiveResources,
  adminRemoveResources,
} from "../services/AdminService";
import {
  applyEmbedImage,
  createBannersEmbed,
  createBattleResultEmbed,
  createBattleProgressEmbed,
  createInventoryEmbed,
  createLeaderboardEmbed,
  createProfileEmbed,
  createSummonResultEmbed,
  createSummonResultEmbeds,
  createTeamEmbed,
  formatUltimateSummary,
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

export async function handleAutocompleteInteraction(interaction: AutocompleteInteraction): Promise<void> {
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

  if (interaction.commandName === "batalha") {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "estagio_id") {
      await respondToAutocomplete(interaction, []);
      return;
    }

    const [stages, worlds] = await Promise.all([listPveStages(), listPveWorlds()]);
    const worldNames = new Map(worlds.map((world) => [world.id, world.name]));
    const choices = stages.map((stage) => formatPveStageChoice(stage, worldNames.get(stage.worldId)));
    await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
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
  const teamData = await getTeam(discordId);
  const currentMembers: OwnedCharacterChoiceSource[] = teamData?.members ?? [];

  if (subcommand === "adicionar") {
    const profile = await getProfile(discordId);
    const currentOwnedIds = new Set(currentMembers.map((member) => member.ownedId));
    const choices = ((profile?.collection ?? []) as OwnedCharacterChoiceSource[])
      .filter((item) => !currentOwnedIds.has(item.ownedId))
      .map((item) => formatCharacterChoice(item));
    await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
    return;
  }

  if (subcommand === "remover" || subcommand === "mover") {
    const choices = currentMembers.map((member) => formatCharacterChoice(member, member.position));
    await respondToAutocomplete(interaction, filterChoicesByFocusedValue(choices, String(focused.value)));
    return;
  }

  await respondToAutocomplete(interaction, []);
}

export async function handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName, user } = interaction;
  const discordId = user.id;
  const username = user.username;

  try {
    // Defer IMEDIATAMENTE para evitar timeout de 3 segundos
    // Alguns comandos podem sobrescrever com seu próprio defer
    const shouldDeferEarly = ["personagem", "perfil", "invocar", "banner", "personagens"];
    
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
      const profile = (await getProfile(discordId)) ?? { user: await getOrCreateUser(discordId, username), collection: [] };
      const teamData = await getTeam(discordId);
      const embed = createProfileEmbed(profile.user, profile.collection.length, teamData?.members?.length ?? 0);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 2. /invocar
    if (commandName === "invocar") {
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
      const embeds = createSummonResultEmbeds(username, result.results, result.currency, result.cost);
      await interaction.editReply({ embeds });
      return;
    }

    // 3. /banner
    if (commandName === "banner") {
      const activeBanners = await listActiveBanners();
      const embed = createBannersEmbed(activeBanners);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 4. /personagens
    if (commandName === "personagens") {
      const animeFilter = interaction.options.getString("anime") ?? undefined;
      const rarityFilter = (interaction.options.getString("raridade") as any) ?? undefined;

      const profile = await getProfile(discordId);
      const catalog = await listCharacters({ anime: animeFilter, rarity: rarityFilter });

      const embed = new EmbedBuilder()
        .setTitle("🎴 Catálogo e Coleção de Personagens")
        .setColor(0x3498db)
        .setDescription(`Exibindo **${catalog.length}** personagem(ns) no catálogo.`);

      let text = "";
      const ownedIds = new Set(profile?.collection.map((c: OwnedCharacterChoiceSource) => c.character.id) ?? []);

      for (let i = 0; i < Math.min(catalog.length, 10); i += 1) {
        const c = catalog[i];
        const ownedSymbol = ownedIds.has(c.id) ? "✅ [Possuído]" : "🔒 [Não possuído]";
        text += `• **${c.name}** (${c.anime}) — *${c.rarity.toUpperCase()}* | ${c.role.toUpperCase()} ${ownedSymbol}\n  ID: \`${c.id}\`\n`;
      }

      embed.addFields({
        name: "Lista de Personagens",
        value: text
          ? text.slice(0, 1024)
          : "Nenhum personagem encontrado com os filtros.",
      });
      if (catalog.length > 0) {
        applyEmbedImage(embed, catalog[0].imageUrl);
      }
      await interaction.editReply({ embeds: [embed] });
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
          .setTitle(`🎴 Personagem: ${found.name}`)
          .setColor(0xf1c40f)
          .addFields(
            { name: "📺 Anime", value: found.anime, inline: true },
            { name: "⭐ Raridade", value: found.rarity.toUpperCase(), inline: true },
            { name: "🗡️ Função", value: found.role.toUpperCase(), inline: true },
            { name: "❤️ HP Base", value: `${found.baseHp}`, inline: true },
            { name: "⚔️ Ataque Base", value: `${found.baseAttack}`, inline: true },
            { name: "🛡️ Defesa Base", value: `${found.baseDefense}`, inline: true },
            { name: "⚡ Velocidade", value: `${found.baseSpeed}`, inline: true },
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

    // 6. /equipe
    if (commandName === "equipe") {
      await interaction.deferReply();
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
      await interaction.deferReply();
      
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
      const action = interaction.options.getString("acao") ?? "ver";
      const questId = interaction.options.getString("id");

      if (action === "resgatar") {
        if (!questId) {
          await interaction.editReply("❌ Forneça o ID da missão que deseja resgatar.");
          return;
        }
        const idempotencyKey = `bot_quest_${discordId}_${questId}_${Date.now()}`;
        const res = await claimQuestReward(discordId, questId, idempotencyKey);
        await interaction.editReply(
          `🎉 **Recompensa Resgatada!**\n• Gold: +${res.rewards.gold}\n• Gemas: +${res.rewards.gems}\n• Tickets: +${res.rewards.tickets}`
        );
        return;
      }

      const questsList = await getUserQuests(discordId, category);
      const embed = new EmbedBuilder().setTitle(`📜 Missões (${category.toUpperCase()})`).setColor(0x3498db);

      if (!questsList.length) {
        embed.setDescription("Nenhuma missão disponível nesta categoria.");
      } else {
        let text = "";
        for (const q of questsList) {
          const quest = q.quest;
          const uq = q.userQuest;
          const status = uq.completed ? (uq.claimedAt ? "✅ [Resgatado]" : "🎁 [Pronto p/ Resgate]") : "⏳ [Em Progresso]";
          text += `• **${quest.title}** (${uq.progress}/${quest.requirementCount}) — ${status}\n  Descrição: ${quest.description}\n  ID: \`${quest.id}\`\n\n`;
        }
        embed.setDescription(text);
      }

      await interaction.editReply({ embeds: [embed] });
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

      let entries: any[] = [];
      if (category === "gold" || category === "gems" || category === "tickets") {
        entries = await getWealthLeaderboard(10);
      } else if (category === "pve") {
        entries = await getPveLeaderboard(10);
      } else if (category === "collection") {
        entries = await getCollectionLeaderboard(10);
      } else {
        entries = await getTeamPowerLeaderboard(10);
      }

      const embed = createLeaderboardEmbed(
        entries.map((e) => ({ username: e.username, gold: e.details?.gold ?? e.score, gems: e.details?.gems ?? 0, tickets: 0 })),
        category
      );
      await interaction.editReply({ embeds: [embed] });
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
