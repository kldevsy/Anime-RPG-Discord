import { describe, expect, it, vi } from "vitest";
import { commandDefinitions } from "../commands";
import { handleInteraction } from "../handlers";
import { validateBotEnv } from "../index";

describe("Discord Bot System", () => {
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
