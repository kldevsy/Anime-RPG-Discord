import { describe, expect, it, vi } from "vitest";
import battleRouter from "../battle";

describe("battle simulation route", () => {
  it("exposes ultimate state and charge events in the simulation contract", () => {
    const handler = (battleRouter as any).stack.find((layer: any) => layer.route?.path === "/battles/simulate").route.stack[0].handle;
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    handler({ body: { playerTeam: [{ id: "hero", name: "Hero", role: "dps", maxHp: 900, attack: 130, defense: 80, speed: 110, ultimateCharge: 90, ultimateChargeRequired: 100 }] } }, { json, status });

    expect(status).not.toHaveBeenCalled();
    const snapshot = json.mock.calls[0][0];
    expect(snapshot.playerTeam[0]).toMatchObject({ ultimateCharge: expect.any(Number), ultimateChargeRequired: 100, ultimateReady: expect.any(Boolean) });
    expect(snapshot.actions.some((action: { type: string }) => action.type === "ultimate_charge" || action.type === "ultimate_ready")).toBe(true);
  });

  it("rejects malformed ultimate charge input", () => {
    const handler = (battleRouter as any).stack.find((layer: any) => layer.route?.path === "/battles/simulate").route.stack[0].handle;
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    handler({ body: { playerTeam: [{ id: "hero", name: "Hero", role: "dps", maxHp: 900, attack: 130, defense: 80, speed: 110, ultimateCharge: -1 }] } }, { json, status });
    expect(status).toHaveBeenCalledWith(400);
  });
});
