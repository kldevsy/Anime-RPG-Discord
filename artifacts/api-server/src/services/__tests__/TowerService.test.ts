import { describe, expect, it } from "vitest";
import { challengeTowerFloor, getTowerProgress } from "../TowerService";
import { getProfile } from "../PhaseOneService";

describe("TowerService", () => {
  it("retrieves user initial tower progress", async () => {
    const discordId = "tower_user_1";
    await getProfile(discordId);

    const status = await getTowerProgress(discordId);
    expect(status.discordId).toBe(discordId);
    expect(status.highestFloor).toBe(0);
    expect(status.nextFloor).toBe(1);
  });

  it("challenges tower floor 1 and advances progress on victory", async () => {
    const discordId = "tower_user_1";
    await getProfile(discordId);

    const outcome = await challengeTowerFloor(discordId);

    expect(outcome.floor).toBe(1);
    expect(outcome.status).toBeDefined();

    if (outcome.status === "victory") {
      expect(outcome.newHighestFloor).toBe(1);
      expect(outcome.rewards.gold).toBe(200);

      const updatedStatus = await getTowerProgress(discordId);
      expect(updatedStatus.highestFloor).toBe(1);
      expect(updatedStatus.nextFloor).toBe(2);
    }
  });
});
