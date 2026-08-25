import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { BattleServiceError, listPlayerBattles, runPlayerBattle } from "../services/BattleService";
import { defaultBattleQueue } from "../services/BattleQueue";
import { IdempotencyService } from "../services/IdempotencyService";

const router: IRouter = Router();
const idSchema = z.string().trim().min(1).max(32);

function handleError(error: unknown, res: Response) {
  return res.status(error instanceof BattleServiceError ? 400 : 500).json({ error: error instanceof Error ? error.message : "Unexpected error" });
}

router.post("/battles", async (req, res) => {
  const parsed = z.object({
    discordId: idSchema,
    stageId: z.string().uuid().optional(),
    idempotencyKey: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid battle request" });

  try {
    if (parsed.data.idempotencyKey) {
      const { processedBefore, result } = await IdempotencyService.executeIdempotent(
        parsed.data.idempotencyKey,
        () => runPlayerBattle(parsed.data.discordId, parsed.data.stageId)
      );
      return res.status(processedBefore ? 200 : 201).json(result);
    }
    return res.status(201).json(await runPlayerBattle(parsed.data.discordId, parsed.data.stageId));
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/battles/queue", async (req, res) => {
  const parsed = z.object({ discordId: idSchema, stageId: z.string().uuid().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid queued battle request" });

  const job = defaultBattleQueue.enqueue(parsed.data.discordId, parsed.data.stageId);
  return res.status(202).json({
    jobId: job.id,
    status: job.status,
    message: "Battle enqueued successfully.",
  });
});

router.get("/battles/job/:jobId", async (req, res) => {
  const jobId = req.params.jobId;
  const job = defaultBattleQueue.getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  return res.json(job);
});

router.get("/battles/:discordId", async (req, res) => {
  const parsed = idSchema.safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid Discord user id" });
  try {
    const battles = await listPlayerBattles(parsed.data);
    return battles ? res.json(battles) : res.status(404).json({ error: "Profile not found" });
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
