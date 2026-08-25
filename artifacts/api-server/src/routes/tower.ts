import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { TowerServiceError, challengeTowerFloor, getTowerProgress } from "../services/TowerService";

const router: IRouter = Router();
const idSchema = z.string().trim().min(1).max(64);

function handleError(error: unknown, res: Response) {
  return res.status(error instanceof TowerServiceError ? 400 : 500).json({
    error: error instanceof Error ? error.message : "Unexpected error",
  });
}

router.get("/tower/:discordId", async (req, res) => {
  const parsed = idSchema.safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid discord id" });

  try {
    const status = await getTowerProgress(parsed.data);
    return res.json(status);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/tower/challenge", async (req, res) => {
  const parsed = z.object({
    discordId: idSchema,
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid tower challenge parameters" });

  try {
    const result = await challengeTowerFloor(parsed.data.discordId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
