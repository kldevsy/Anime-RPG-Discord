import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { listPveStages, listPveWorlds, PveServiceError } from "../services/PveService";

const router: IRouter = Router();
function error(error: unknown, res: Response) {
  return res.status(error instanceof PveServiceError ? 400 : 500).json({ error: error instanceof Error ? error.message : "Unexpected error" });
}
router.get("/pve/worlds", async (_req, res) => {
  try { return res.json(await listPveWorlds()); } catch (e) { return error(e, res); }
});
router.get("/pve/stages", async (req, res) => {
  const parsed = z.object({ worldId: z.string().uuid().optional() }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid world id" });
  try { return res.json(await listPveStages(parsed.data.worldId)); } catch (e) { return error(e, res); }
});
export default router;