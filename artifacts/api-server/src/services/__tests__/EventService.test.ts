import { describe, expect, it } from "vitest";
import { challengeEvent, getEventById, listEvents } from "../EventService";
import { getProfile } from "../PhaseOneService";

describe("EventService", () => {
  it("lists active events", async () => {
    const eventsList = await listEvents();
    expect(eventsList.length).toBeGreaterThan(0);
    expect(eventsList[0]).toHaveProperty("name");
    expect(eventsList[0]).toHaveProperty("enemyHp");
  });

  it("gets event by ID", async () => {
    const eventsList = await listEvents();
    const event = await getEventById(eventsList[0].id);
    expect(event).not.toBeNull();
    expect(event?.id).toBe(eventsList[0].id);
  });

  it("challenges an active event and awards rewards on victory", async () => {
    const userDiscordId = "test_event_user_1";
    await getProfile(userDiscordId);

    const eventsList = await listEvents();
    const result = await challengeEvent(userDiscordId, eventsList[0].id);

    expect(result).toHaveProperty("result");
    expect(result).toHaveProperty("rewards");
    expect(result.status).toBeDefined();

    if (result.status === "victory") {
      expect(result.rewards.gold).toBeGreaterThan(0);
    }
  });

  it("throws error when event ID is invalid", async () => {
    await expect(challengeEvent("test_event_user_1", "invalid-id")).rejects.toThrow("Event not found or inactive.");
  });
});
