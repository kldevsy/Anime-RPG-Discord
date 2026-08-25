import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { getUserPveProgress, listPveStages, listPveWorlds, PveServiceError } from "../services/PveService";

const router: IRouter = Router();

function error(err: unknown, res: Response) {
  return res.status(err instanceof PveServiceError ? 400 : 500).json({ error: err instanceof Error ? err.message : "Unexpected error" });
}

router.get("/pve/worlds", async (_req, res) => {
  try {
    return res.json(await listPveWorlds());
  } catch (e) {
    return error(e, res);
  }
});

router.get("/pve/stages", async (req, res) => {
  const parsed = z
    .object({
      worldId: z.string().uuid().optional(),
      type: z.enum(["story", "dungeon", "boss", "tower", "event", "raid"]).optional(),
    })
    .safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query parameters" });
  try {
    return res.json(await listPveStages(parsed.data));
  } catch (e) {
    return error(e, res);
  }
});

router.get("/pve/progress/:discordId", async (req, res) => {
  const parsed = z.string().trim().min(1).max(32).safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid Discord user id" });
  try {
    const progress = await getUserPveProgress(parsed.data);
    return res.json({ discordId: parsed.data, clearedStages: progress });
  } catch (e) {
    return error(e, res);
  }
});

export default router;
