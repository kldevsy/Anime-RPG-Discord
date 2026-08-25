import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { RaidServiceError, challengeRaid, getRaidById, getRaidLeaderboard, listRaids } from "../services/RaidService";

const router: IRouter = Router();
const idSchema = z.string().trim().min(1).max(64);

function handleError(error: unknown, res: Response) {
  return res.status(error instanceof RaidServiceError ? 400 : 500).json({
    error: error instanceof Error ? error.message : "Unexpected error",
  });
}

router.get("/raids", async (_req, res) => {
  try {
    const activeRaids = await listRaids();
    return res.json(activeRaids);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/raids/:id", async (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: "Invalid raid id" });
  try {
    const raid = await getRaidById(parsed.data);
    if (!raid) return res.status(404).json({ error: "Raid not found" });
    return res.json(raid);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/raids/challenge", async (req, res) => {
  const parsed = z.object({
    discordId: idSchema,
    raidId: idSchema,
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid raid challenge parameters" });

  try {
    const result = await challengeRaid(parsed.data.discordId, parsed.data.raidId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/raids/:id/leaderboard", async (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: "Invalid raid id" });

  try {
    const leaderboard = await getRaidLeaderboard(parsed.data);
    return res.json(leaderboard);
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
