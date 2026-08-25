import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { PvpServiceError, challengePvp, getPvpLeaderboard, getPvpProfile, listPvpOpponents } from "../services/PvpService";

const router: IRouter = Router();
const idSchema = z.string().trim().min(1).max(64);

function handleError(error: unknown, res: Response) {
  return res.status(error instanceof PvpServiceError ? 400 : 500).json({
    error: error instanceof Error ? error.message : "Unexpected error",
  });
}

router.get("/pvp/profile/:discordId", async (req, res) => {
  const parsed = idSchema.safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid discord id" });

  try {
    const profile = await getPvpProfile(parsed.data);
    return res.json(profile);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/pvp/opponents/:discordId", async (req, res) => {
  const parsed = idSchema.safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid discord id" });

  try {
    const opponents = await listPvpOpponents(parsed.data);
    return res.json(opponents);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/pvp/challenge", async (req, res) => {
  const parsed = z.object({
    challengerDiscordId: idSchema,
    defenderDiscordId: idSchema,
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid PvP challenge parameters" });

  try {
    const result = await challengePvp(parsed.data.challengerDiscordId, parsed.data.defenderDiscordId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/pvp/leaderboard", async (_req, res) => {
  try {
    const leaderboard = await getPvpLeaderboard();
    return res.json(leaderboard);
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
