import { Router, type IRouter } from "express";
import healthRouter from "./health";
import phaseOneRouter from "./phase-one";
import summonRouter from "./summon";

const router: IRouter = Router();

router.use(healthRouter);
router.use(phaseOneRouter);
router.use(summonRouter);

export default router;
