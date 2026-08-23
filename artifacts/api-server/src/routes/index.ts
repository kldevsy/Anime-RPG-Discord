import { Router, type IRouter } from "express";
import healthRouter from "./health";
import phaseOneRouter from "./phase-one";

const router: IRouter = Router();

router.use(healthRouter);
router.use(phaseOneRouter);

export default router;
