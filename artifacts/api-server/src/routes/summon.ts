import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { getSummonHistory, listActiveBanners, summon, SummonError } from "../services/SummonService";

const router: IRouter = Router();
const summonBody = z.object({
  discordId: z.string().trim().min(1).max(32),
  bannerId: z.string().uuid(),
  quantity: z.union([z.literal(1), z.literal(10)]),
  idempotencyKey: z.string().trim().min(8).max(120),
});
function handleError(error: unknown, res: Response) {
  return res.status(error instanceof SummonError ? 400 : 500).json({ error: error instanceof Error ? error.message : "Unexpected error" });
}

router.get("/banners", async (_req, res) => {
  try { return res.json(await listActiveBanners()); } catch (error) { return handleError(error, res); }
});

router.post("/summons", async (req, res) => {
  const parsed = summonBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid summon data", details: parsed.error.flatten() });
  try { return res.status(201).json(await summon(parsed.data.discordId, parsed.data.bannerId, parsed.data.quantity, parsed.data.idempotencyKey)); } catch (error) { return handleError(error, res); }
});

router.get("/summons/history/:discordId", async (req, res) => {
  const parsed = z.string().trim().min(1).max(32).safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid Discord user id" });
  try { return res.json(await getSummonHistory(parsed.data)); } catch (error) { return handleError(error, res); }
});

export default router;