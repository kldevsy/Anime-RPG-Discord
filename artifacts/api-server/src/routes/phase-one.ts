import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import {
  DatabaseUnavailableError,
  getOrCreateUser,
  getProfile,
  getTeam,
  listCharacters,
  replaceTeam,
} from "../services/PhaseOneService";

const router: IRouter = Router();
const discordId = z.string().trim().min(1).max(32);
const profileBody = z.object({ discordId, username: z.string().trim().min(1).max(100) });
const teamBody = z.object({
  discordId,
  name: z.string().trim().min(1).max(40).default("Equipe principal"),
  ownedCharacterIds: z.array(z.string().uuid()).max(5),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof DatabaseUnavailableError) return res.status(503).json({ error: error.message });
  const message = error instanceof Error ? error.message : "Unexpected error";
  return res.status(400).json({ error: message });
}

router.post("/profiles", async (req, res) => {
  const parsed = profileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid profile data", details: parsed.error.flatten() });
  try {
    return res.status(200).json(await getOrCreateUser(parsed.data.discordId, parsed.data.username));
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/profiles/:discordId", async (req, res) => {
  const parsed = discordId.safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid Discord user id" });
  try {
    const profile = await getProfile(parsed.data);
    return profile ? res.json(profile) : res.status(404).json({ error: "Profile not found" });
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/characters", async (req, res) => {
  const filters = z.object({ anime: z.string().trim().max(80).optional(), rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary", "mythic"]).optional() }).safeParse(req.query);
  if (!filters.success) return res.status(400).json({ error: "Invalid character filters" });
  try {
    return res.json(await listCharacters(filters.data));
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/teams/:discordId", async (req, res) => {
  const parsed = discordId.safeParse(req.params.discordId);
  if (!parsed.success) return res.status(400).json({ error: "Invalid Discord user id" });
  try {
    const team = await getTeam(parsed.data);
    return team ? res.json(team) : res.status(404).json({ error: "Profile not found" });
  } catch (error) {
    return handleError(error, res);
  }
});

router.put("/teams", async (req, res) => {
  const parsed = teamBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid team data", details: parsed.error.flatten() });
  try {
    return res.json(await replaceTeam(parsed.data.discordId, parsed.data.name, parsed.data.ownedCharacterIds));
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;