import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { claimQuestReward, getUserQuests, QuestError } from "../services/QuestService";

const router = Router();

const claimSchema = z.object({
  discordId: z.string().min(1),
  questId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

router.get("/api/quests/:discordId", async (req: Request, res: Response): Promise<void> => {
  const discordId = Array.isArray(req.params.discordId) ? req.params.discordId[0] : req.params.discordId;
  const category = req.query.category as "daily" | "weekly" | "monthly" | "story" | "event" | undefined;

  try {
    const quests = await getUserQuests(discordId, category);
    res.status(200).json({ quests });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user quests." });
  }
});

router.post("/api/quests/claim", async (req: Request, res: Response): Promise<void> => {
  const parseResult = claimSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid claim payload.", details: parseResult.error.flatten() });
    return;
  }

  const { discordId, questId, idempotencyKey } = parseResult.data;

  try {
    const result = await claimQuestReward(discordId, questId, idempotencyKey);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof QuestError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to claim quest reward." });
  }
});

export default router;
