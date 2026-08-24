import { Router, type IRouter } from "express";
import healthRouter from "./health";
import phaseOneRouter from "./phase-one";
import summonRouter from "./summon";
import battleRouter from "./battle";

const router: IRouter = Router();

router.use(healthRouter);
router.use(phaseOneRouter);
router.use(summonRouter);
router.use(battleRouter);

export default router;
