import { Router, type Request, type Response } from "express";
import { getCollectionLeaderboard, getPveLeaderboard, getTeamPowerLeaderboard, getWealthLeaderboard } from "../services/RankingService";

const router = Router();

router.get("/api/ranking/:category", async (req: Request, res: Response): Promise<void> => {
  const category = req.params.category;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

  try {
    let leaderboard;
    switch (category) {
      case "wealth":
        leaderboard = await getWealthLeaderboard(limit);
        break;
      case "pve":
        leaderboard = await getPveLeaderboard(limit);
        break;
      case "collection":
        leaderboard = await getCollectionLeaderboard(limit);
        break;
      case "power":
        leaderboard = await getTeamPowerLeaderboard(limit);
        break;
      default:
        res.status(400).json({ error: "Invalid ranking category. Valid categories: wealth, pve, collection, power." });
        return;
    }

    res.status(200).json({ category, leaderboard });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ranking leaderboard." });
  }
});

export default router;
