/**
 * ========================================
 * RAID HANDLERS
 * ========================================
 * Handlers para sistema de raids cooperativas
 */

import type { ChatInputCommandInteraction } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } from "discord.js";
import { raidService } from "../services/RaidService";
import { RAID_CATALOG, getRaidById } from "@workspace/db/data/raid-catalog";
import { db } from "@workspace/db";
import {
  raidInstances,
  raidInstanceParticipants,
  raidTeamMembers,
  raidCompletions,
  users,
  userCharacters,
  characters,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  createRaidListEmbed,
  createRaidRoomEmbed,
  createRaidMapDetailsEmbed,
  createRaidVictoryEmbed,
  createRaidLeaderboardEmbed,
} from "./embeds";

/**
 * Handler principal do comando /raid
 */
export async function handleRaidCommand(
  interaction: ChatInputCommandInteraction,
  discordId: string,
  getProfile: (discordId: string) => Promise<any>
) {
  const action = interaction.options.getString("acao", true);

  try {
    // ========================================
    // AÇÃO: LISTAR RAIDS
    // ========================================
    if (action === "list") {
      const profile = await getProfile(discordId);
      if (!profile) {
        await interaction.editReply("❌ Perfil não encontrado. Use `/perfil` primeiro!");
        return;
      }

      // Calcular nível médio da coleção
      const avgLevel =
        profile.collection.length > 0
          ? Math.floor(
              profile.collection.reduce((sum: number, c: any) => sum + c.level, 0) / profile.collection.length
            )
          : 1;

      const availableRaids = raidService.getAvailableRaids(avgLevel);
      const embed = createRaidListEmbed(availableRaids);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ========================================
    // AÇÃO: CRIAR SALA
    // ========================================
    if (action === "create") {
      const raidMapId = interaction.options.getString("mapa");
      const difficulty = interaction.options.getString("dificuldade") as "normal" | "hard" | "nightmare" | null;

      if (!raidMapId || !difficulty) {
        await interaction.editReply(
          "❌ Para criar uma raid, especifique:\n" + "`/raid acao:Criar mapa:[escolha] dificuldade:[escolha]`"
        );
        return;
      }

      try {
        const result = await raidService.createRaid({
          leaderId: discordId,
          raidMapId,
          difficulty,
        });

        const embed = new EmbedBuilder()
          .setTitle("✅ SALA DE RAID CRIADA!")
          .setColor(0x2ecc71)
          .setDescription(
            `🎯 **${result.raidMap.name}**\n` +
              `${difficulty === "normal" ? "🟢" : difficulty === "hard" ? "🟡" : "🔴"} **${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}**\n\n` +
              `🔑 **Código da Sala:** \`${result.roomCode}\`\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Como continuar:**\n` +
              `1️⃣ Compartilhe o código com seus amigos\n` +
              `2️⃣ Eles entram com: \`/raid acao:Entrar codigo:${result.roomCode}\`\n` +
              `3️⃣ Todos adicionam personagens (use os botões)\n` +
              `4️⃣ Quando prontos, você (líder) inicia a raid!\n\n` +
              `⏰ **Expira em:** 15 minutos\n` +
              `👥 **Jogadores:** 1/4\n` +
              `🎴 **Personagens:** 0/4`
          )
          .setFooter({ text: `ID da Raid: ${result.raidInstance.id}` })
          .setTimestamp();

        // Botões para gerenciar a sala
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`raid_add_char:${result.raidInstance.id}`)
            .setLabel("➕ Adicionar Personagem")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`raid_status:${result.raidInstance.id}`)
            .setLabel("📊 Ver Status")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`raid_start:${result.raidInstance.id}`)
            .setLabel("🚀 Iniciar Raid")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true), // Ativa quando time estiver completo
          new ButtonBuilder()
            .setCustomId(`raid_leave:${result.raidInstance.id}`)
            .setLabel("🚪 Sair")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message}`);
      }

      return;
    }

    // ========================================
    // AÇÃO: ENTRAR NA RAID
    // ========================================
    if (action === "join") {
      const roomCode = interaction.options.getString("codigo");

      if (!roomCode) {
        await interaction.editReply(
          "❌ Especifique o código da sala:\n" + "`/raid acao:Entrar codigo:RAID-XXXX`"
        );
        return;
      }

      try {
        const result = await raidService.joinRaid({
          userId: discordId,
          roomCode: roomCode.toUpperCase(),
        });

        const embed = new EmbedBuilder()
          .setTitle("✅ VOCÊ ENTROU NA RAID!")
          .setColor(0x3498db)
          .setDescription(
            `🔑 **Código:** \`${roomCode.toUpperCase()}\`\n` +
              `👥 **Jogadores:** ${result.participantCount}/4\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Próximo passo:**\n` +
              `➕ Adicione seus personagens à equipe!\n` +
              `Use os botões abaixo ou:\n` +
              `\`/raid acao:Status codigo:${roomCode.toUpperCase()}\``
          )
          .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`raid_add_char:${result.raidInstance.id}`)
            .setLabel("➕ Adicionar Personagem")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`raid_status:${result.raidInstance.id}`)
            .setLabel("📊 Ver Status")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`raid_leave:${result.raidInstance.id}`)
            .setLabel("🚪 Sair")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message}`);
      }

      return;
    }

    // ========================================
    // AÇÃO: VER STATUS
    // ========================================
    if (action === "status") {
      const roomCode = interaction.options.getString("codigo");

      if (!roomCode) {
        await interaction.editReply("❌ Especifique o código: `/raid acao:Status codigo:RAID-XXXX`");
        return;
      }

      try {
        const status = await raidService.getRaidStatus(roomCode.toUpperCase());

        if (!status.raidMap) {
          await interaction.editReply("❌ Raid map não encontrado!");
          return;
        }

        const embed = createRaidRoomEmbed(
          status.raidMap,
          status.raidInstance.difficulty,
          roomCode.toUpperCase(),
          status.participants,
          status.teamMembers
        );

        // Botões
        const canStart = status.teamMembers.length === 4 && status.raidInstance.status === "waiting";

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`raid_add_char:${status.raidInstance.id}`)
            .setLabel("➕ Adicionar Personagem")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(status.teamMembers.length >= 4),
          new ButtonBuilder()
            .setCustomId(`raid_start:${status.raidInstance.id}`)
            .setLabel("🚀 Iniciar Raid")
            .setStyle(ButtonStyle.Success)
            .setDisabled(!canStart),
          new ButtonBuilder()
            .setCustomId(`raid_leave:${status.raidInstance.id}`)
            .setLabel("🚪 Sair")
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message}`);
      }

      return;
    }

    // ========================================
    // AÇÃO: SAIR
    // ========================================
    if (action === "leave") {
      const roomCode = interaction.options.getString("codigo");

      if (!roomCode) {
        await interaction.editReply("❌ Especifique o código: `/raid acao:Sair codigo:RAID-XXXX`");
        return;
      }

      try {
        // Buscar raid
        const [raidInstance] = await db
          .select()
          .from(raidInstances)
          .where(eq(raidInstances.roomCode, roomCode.toUpperCase()))
          .limit(1);

        if (!raidInstance) {
          await interaction.editReply("❌ Raid não encontrada!");
          return;
        }

        const result = await raidService.leaveRaid(discordId, raidInstance.id);

        if (result.cancelled) {
          await interaction.editReply(
            `✅ **Você (líder) saiu da raid.**\n\n` + `A sala \`${roomCode.toUpperCase()}\` foi cancelada.`
          );
        } else {
          await interaction.editReply(
            `✅ **Você saiu da raid.**\n\n` + `Sala: \`${roomCode.toUpperCase()}\``
          );
        }
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message}`);
      }

      return;
    }

    // ========================================
    // AÇÃO: LEADERBOARD
    // ========================================
    if (action === "ranking") {
      const raidMapId = interaction.options.getString("mapa");
      const difficulty = interaction.options.getString("dificuldade") as "normal" | "hard" | "nightmare" | null;

      if (!raidMapId || !difficulty) {
        await interaction.editReply(
          "❌ Especifique o mapa e dificuldade:\n" +
            "`/raid acao:Leaderboard mapa:[escolha] dificuldade:[escolha]`"
        );
        return;
      }

      const raidMap = getRaidById(raidMapId);
      if (!raidMap) {
        await interaction.editReply("❌ Raid map não encontrado!");
        return;
      }

      try {
        const entries = await raidService.getLeaderboard(raidMapId, difficulty, 10);
        const embed = createRaidLeaderboardEmbed(raidMap, difficulty, entries);

        await interaction.editReply({ embeds: [embed] });
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message}`);
      }

      return;
    }

    // ========================================
    // AÇÃO: INFO
    // ========================================
    if (action === "info") {
      const raidMapId = interaction.options.getString("mapa");
      const difficulty = interaction.options.getString("dificuldade") as "normal" | "hard" | "nightmare" | null;

      if (!raidMapId || !difficulty) {
        await interaction.editReply(
          "❌ Especifique o mapa e dificuldade:\n" + "`/raid acao:Info mapa:[escolha] dificuldade:[escolha]`"
        );
        return;
      }

      const raidMap = getRaidById(raidMapId);
      if (!raidMap) {
        await interaction.editReply("❌ Raid map não encontrado!");
        return;
      }

      const embed = createRaidMapDetailsEmbed(raidMap, difficulty);
      await interaction.editReply({ embeds: [embed] });

      return;
    }

    await interaction.editReply("❌ Ação desconhecida!");
  } catch (error: any) {
    console.error("❌ [RAID COMMAND ERROR]", error);
    await interaction.editReply(`❌ Erro: ${error.message}`);
  }
}
