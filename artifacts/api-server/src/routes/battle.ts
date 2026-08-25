import { Router, type IRouter } from "express";
import { z } from "@workspace/api-zod";
import { BattleEngine } from "../battle/BattleEngine";
import { SkillManager } from "../battle/SkillManager";
import type { Combatant } from "../battle/BattleState";

const router: IRouter = Router();
const battleRequest = z.object({
  playerTeam: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        role: z.enum(["tank", "dps", "support", "healer", "control"]),
        maxHp: z.number().positive(),
        attack: z.number().positive(),
        defense: z.number().nonnegative(),
        speed: z.number().positive(),
        ultimateCharge: z.number().nonnegative().optional(),
        ultimateChargeRequired: z.number().positive().optional(),
      })
    )
    .min(1)
    .max(5),
});

function buildTeam(
  input: z.infer<typeof battleRequest>["playerTeam"],
  prefix: string
): Combatant[] {
  return input.map((unit, index) =>
    SkillManager.createCombatant({
      id: `${prefix}-${index}`,
      name: unit.name,
      role: unit.role,
      maxHp: unit.maxHp,
      hp: unit.maxHp,
      attack: unit.attack,
      defense: unit.defense,
      speed: unit.speed,
      critChance: 15,
      critDamage: 1.5,
      energy: 0,
      alive: true,
      ultimateCharge: unit.ultimateCharge,
      ultimateChargeRequired: unit.ultimateChargeRequired,
      ultimateReady: (unit.ultimateCharge ?? 0) >= (unit.ultimateChargeRequired ?? 100),
    })
  );
}

router.post("/battles/simulate", (req, res) => {
  const parsed = battleRequest.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "Invalid battle team", details: parsed.error.flatten() });
  const player = buildTeam(parsed.data.playerTeam, "player");
  const enemy = buildTeam(
    parsed.data.playerTeam.map((unit) => ({
      ...unit,
      name: `Inimigo ${unit.name}`,
      maxHp: Math.floor(unit.maxHp * 0.8),
      attack: Math.floor(unit.attack * 0.85),
    })),
    "enemy"
  );
  return res.json(new BattleEngine(player, enemy).run());
});

export default router;
