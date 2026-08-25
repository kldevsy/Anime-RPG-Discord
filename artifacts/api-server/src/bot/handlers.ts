import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
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
import { listPveStages, listPveWorlds } from "../services/PveService";
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
  createBannersEmbed,
  createBattleResultEmbed,
  createInventoryEmbed,
  createLeaderboardEmbed,
  createProfileEmbed,
  createSummonResultEmbed,
  createTeamEmbed,
} from "./embeds";

type AutocompleteChoice = { name: string; value: string };
type OwnedCharacterChoiceSource = { ownedId: string; level: number; position?: number; character: { id?: string; name: string; anime: string; rarity: string; role?: string } };

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
      await interaction.respond(filterChoicesByFocusedValue(choices, String(focused.value)));
      return;
    }
    await interaction.respond([]);
    return;
  }

  if (interaction.commandName === "batalha") {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "estagio_id") {
      await interaction.respond([]);
      return;
    }

    const [stages, worlds] = await Promise.all([listPveStages(), listPveWorlds()]);
    const worldNames = new Map(worlds.map((world) => [world.id, world.name]));
    const choices = stages.map((stage) => formatPveStageChoice(stage, worldNames.get(stage.worldId)));
    await interaction.respond(filterChoicesByFocusedValue(choices, String(focused.value)));
    return;
  }

  if (interaction.commandName !== "equipe") {
    await interaction.respond([]);
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  const focused = interaction.options.getFocused(true);
  if (focused.name !== "personagem_id") {
    await interaction.respond([]);
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
    await interaction.respond(filterChoicesByFocusedValue(choices, String(focused.value)));
    return;
  }

  if (subcommand === "remover" || subcommand === "mover") {
    const choices = currentMembers.map((member) => formatCharacterChoice(member, member.position));
    await interaction.respond(filterChoicesByFocusedValue(choices, String(focused.value)));
    return;
  }

  await interaction.respond([]);
}

export async function handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName, user } = interaction;
  const discordId = user.id;
  const username = user.username;

  try {
    // 1. /perfil
    if (commandName === "perfil") {
      await interaction.deferReply();
      const profile = (await getProfile(discordId)) ?? { user: await getOrCreateUser(discordId, username), collection: [] };
      const teamData = await getTeam(discordId);
      const embed = createProfileEmbed(profile.user, profile.collection.length, teamData?.members?.length ?? 0);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 2. /invocar
    if (commandName === "invocar") {
      await interaction.deferReply();
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
      const embed = createSummonResultEmbed(username, result.results, result.currency, result.cost);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 3. /banner
    if (commandName === "banner") {
      await interaction.deferReply();
      const activeBanners = await listActiveBanners();
      const embed = createBannersEmbed(activeBanners);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 4. /personagens
    if (commandName === "personagens") {
      await interaction.deferReply();
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

      embed.addFields({ name: "Lista de Personagens", value: text || "Nenhum personagem encontrado com os filtros." });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 5. /personagem
    if (commandName === "personagem") {
      await interaction.deferReply();
      const query = interaction.options.getString("nome", true).toLowerCase();
      const catalog = await listCharacters({});
      const found = catalog.find((c: any) => c.name.toLowerCase().includes(query) || c.id === query);

      if (!found) {
        await interaction.editReply("❌ Personagem não encontrado no catálogo.");
        return;
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
          { name: "🔮 Passiva", value: found.passive ?? "Nenhuma", inline: true }
        );

      if (found.imageUrl) {
        embed.setImage(found.imageUrl);
      }

      await interaction.editReply({ embeds: [embed] });
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
      const stageId = interaction.options.getString("estagio_id") ?? undefined;

      const { result, rewards, drops } = await runPlayerBattle(discordId, stageId);
      const stageName = stageId ? `Estágio ${stageId.slice(0, 8)}` : "Mundo 1: Fase Inicial";

      const embed = createBattleResultEmbed(username, stageName, result, rewards, drops);
      await interaction.editReply({ embeds: [embed] });
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

        const created = await adminCreateCharacter({ anime, name, rarity, role, baseHp, baseAttack, baseDefense, baseSpeed, passive });
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
    const errorMsg = `❌ **Erro:** ${err.message || "Ocorreu um erro ao processar o comando."}`;
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMsg);
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
}
