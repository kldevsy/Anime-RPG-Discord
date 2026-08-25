import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { claimDailyReward, DailyRewardError, getDailyRewardStatus } from "../services/DailyRewardService";

const router = Router();

const claimSchema = z.object({
  discordId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

router.get("/api/daily/status/:discordId", async (req: Request, res: Response): Promise<void> => {
  const discordId = Array.isArray(req.params.discordId) ? req.params.discordId[0] : req.params.discordId;

  try {
    const status = await getDailyRewardStatus(discordId);
    res.status(200).json(status);
  } catch (error) {
    if (error instanceof DailyRewardError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to fetch daily reward status." });
  }
});

router.post("/api/daily/claim", async (req: Request, res: Response): Promise<void> => {
  const parseResult = claimSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid daily claim payload.", details: parseResult.error.flatten() });
    return;
  }

  const { discordId, idempotencyKey } = parseResult.data;

  try {
    const result = await claimDailyReward(discordId, idempotencyKey);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof DailyRewardError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to claim daily reward." });
  }
});

export default router;
