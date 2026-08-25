import { describe, expect, it, vi } from "vitest";
import { commandDefinitions } from "../commands";
import { handleAutocompleteInteraction, handleInteraction } from "../handlers";
import { validateBotEnv } from "../index";

describe("Discord Bot System", () => {
  it("should configure /invocar banner option with autocomplete true and proper description", () => {
    const invocarCmd = commandDefinitions.find((cmd) => cmd.name === "invocar");
    expect(invocarCmd).toBeDefined();
    const json = invocarCmd?.toJSON();
    const bannerOpt = json?.options?.find((opt: any) => opt.name === "banner") as any;
    expect(bannerOpt).toBeDefined();
    expect(bannerOpt.autocomplete).toBe(true);
    expect(bannerOpt.description).toBe("Escolha ou pesquise um banner ativo");
  });

  it("should configure /batalha stage option with autocomplete and selection guidance", () => {
    const batalhaCmd = commandDefinitions.find((cmd) => cmd.name === "batalha");
    const json = batalhaCmd?.toJSON();
    const stageOpt = json?.options?.find((opt: any) => opt.name === "estagio_id") as any;

    expect(stageOpt).toBeDefined();
    expect(stageOpt.autocomplete).toBe(true);
    expect(stageOpt.description).toContain("Selecione um estágio");
  });
  it("should define all required user and admin slash commands", () => {
    const commandNames = commandDefinitions.map((cmd) => cmd.name);
    expect(commandNames).toContain("perfil");
    expect(commandNames).toContain("invocar");
    expect(commandNames).toContain("banner");
    expect(commandNames).toContain("personagens");
    expect(commandNames).toContain("personagem");
    expect(commandNames).toContain("equipe");
    expect(commandNames).toContain("batalha");
    expect(commandNames).toContain("missoes");
    expect(commandNames).toContain("inventario");
    expect(commandNames).toContain("diario");
    expect(commandNames).toContain("ranking");
    expect(commandNames).toContain("historico");
    expect(commandNames).toContain("admin");
  });

  it("should validate bot env variables gracefully", () => {
    delete process.env["DISCORD_TOKEN"];
    expect(validateBotEnv()).toBeNull();

    process.env["DISCORD_TOKEN"] = "mock_token";
    process.env["CLIENT_ID"] = "mock_client_id";
    const env = validateBotEnv();
    expect(env?.token).toBe("mock_token");
    expect(env?.clientId).toBe("mock_client_id");
  });

  it("should handle /perfil command interaction", async () => {
    const editReplyMock = vi.fn();
    const mockInteraction: any = {
      commandName: "perfil",
      user: { id: "bot_test_user_1", username: "BotTester" },
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: editReplyMock,
    };

    await handleInteraction(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(editReplyMock).toHaveBeenCalled();
    const payload = editReplyMock.mock.calls[0][0];
    expect(payload.embeds).toBeDefined();
    expect(payload.embeds[0].data.title).toContain("Perfil de BotTester");
  });

  it("should handle /invocar autocomplete interaction for banner option", async () => {
    const respondMock = vi.fn();
    const mockInteraction: any = {
      commandName: "invocar",
      user: { id: "bot_test_user_1", username: "BotTester" },
      options: {
        getFocused: (full: boolean) => ({ name: "banner", value: "Normal" }),
      },
      respond: respondMock,
    };

    await handleAutocompleteInteraction(mockInteraction);

    expect(respondMock).toHaveBeenCalled();
    const choices = respondMock.mock.calls[0][0];
    expect(choices.length).toBeGreaterThan(0);
    expect(choices[0].name).toContain("Normal");
    expect(choices[0].value).toBeDefined();
  });

  it("should return searchable UUID choices for /batalha stage autocomplete", async () => {
    const respondMock = vi.fn();
    const mockInteraction: any = {
      commandName: "batalha",
      user: { id: "bot_test_user_1", username: "BotTester" },
      options: {
        getFocused: () => ({ name: "estagio_id", value: "Fronteira" }),
      },
      respond: respondMock,
    };

    await handleAutocompleteInteraction(mockInteraction);

    const choices = respondMock.mock.calls[0][0];
    expect(choices).toContainEqual({
      name: expect.stringContaining("Fronteira das Ondas"),
      value: "20000000-0000-4000-8000-000000000001",
    });
  });

  it("should ask user to select banner when multiple banners are active and none specified in /invocar", async () => {
    const editReplyMock = vi.fn();
    const mockInteraction: any = {
      commandName: "invocar",
      user: { id: "bot_test_user_1", username: "BotTester" },
      options: {
        getInteger: () => 1,
        getString: () => null,
      },
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: editReplyMock,
    };

    await handleInteraction(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(editReplyMock).toHaveBeenCalled();
    const responseText = editReplyMock.mock.calls[0][0];
    expect(responseText).toContain("Existem múltiplos banners ativos");
  });

  it("should handle /banner command interaction", async () => {
    const editReplyMock = vi.fn();
    const mockInteraction: any = {
      commandName: "banner",
      user: { id: "bot_test_user_1", username: "BotTester" },
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: editReplyMock,
    };

    await handleInteraction(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(editReplyMock).toHaveBeenCalled();
    const payload = editReplyMock.mock.calls[0][0];
    expect(payload.embeds[0].data.title).toContain("Banners de Invocação Ativos");
  });

  it("should handle /inventario command interaction", async () => {
    const editReplyMock = vi.fn();
    const mockInteraction: any = {
      commandName: "inventario",
      user: { id: "bot_test_user_1", username: "BotTester" },
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: editReplyMock,
    };

    await handleInteraction(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(editReplyMock).toHaveBeenCalled();
    const payload = editReplyMock.mock.calls[0][0];
    expect(payload.embeds[0].data.title).toContain("Inventário de BotTester");
  });

  it("should handle /admin give command interaction", async () => {
    const editReplyMock = vi.fn();
    const mockInteraction: any = {
      commandName: "admin",
      user: { id: "bot_test_admin", username: "AdminTester" },
      options: {
        getSubcommand: () => "give",
        getString: (name: string) => (name === "usuario" ? "bot_test_user_1" : null),
        getInteger: (name: string) => (name === "gold" ? 500 : name === "gems" ? 100 : 0),
      },
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: editReplyMock,
    };

    await handleInteraction(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(editReplyMock).toHaveBeenCalled();
    const responseText = editReplyMock.mock.calls[0][0];
    expect(responseText).toContain("[ADMIN] Concedido a bot_test_user_1");
  });
});
