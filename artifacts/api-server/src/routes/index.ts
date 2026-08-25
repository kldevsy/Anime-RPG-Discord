import { Router, type IRouter } from "express";
import healthRouter from "./health";
import phaseOneRouter from "./phase-one";
import summonRouter from "./summon";
import battleRouter from "./battle";
import playerBattleRouter from "./player-battle";
import pveRouter from "./pve";
import economyRouter from "./economy";
import questsRouter from "./quests";
import dailyRouter from "./daily";
import rankingRouter from "./ranking";

const router: IRouter = Router();

router.use(healthRouter);
router.use(phaseOneRouter);
router.use(summonRouter);
router.use(battleRouter);
router.use(playerBattleRouter);
router.use(pveRouter);
router.use(economyRouter);
router.use(questsRouter);
router.use(dailyRouter);
router.use(rankingRouter);

export default router;
