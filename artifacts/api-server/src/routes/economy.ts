import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { EconomyError, getTransactionHistory, processTransaction } from "../services/EconomyService";

const router = Router();

const transactionSchema = z.object({
  discordId: z.string().min(1),
  gold: z.number().optional(),
  gems: z.number().optional(),
  tickets: z.number().optional(),
  type: z.enum(["earn", "spend", "reward", "admin"]),
  source: z.string().min(1),
  referenceId: z.string().min(1),
});

router.post("/api/economy/transaction", async (req: Request, res: Response): Promise<void> => {
  const parseResult = transactionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid transaction payload.", details: parseResult.error.flatten() });
    return;
  }

  try {
    const result = await processTransaction(parseResult.data);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof EconomyError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to process economy transaction." });
  }
});

router.get("/api/economy/history/:discordId", async (req: Request, res: Response): Promise<void> => {
  const discordId = Array.isArray(req.params.discordId) ? req.params.discordId[0] : req.params.discordId;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  try {
    const history = await getTransactionHistory(discordId, limit);
    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transaction history." });
  }
});

export default router;
