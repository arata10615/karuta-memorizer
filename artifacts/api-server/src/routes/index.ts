import { Router, type IRouter } from "express";
import healthRouter from "./health";
import placementsRouter from "./placements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(placementsRouter);

export default router;
