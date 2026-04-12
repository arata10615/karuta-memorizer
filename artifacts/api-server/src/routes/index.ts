import { Router, type IRouter } from "express";
import healthRouter from "./health";
import placementsRouter from "./placements";
import usersRouter from "./users";
import adsRouter from "./ads";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(placementsRouter);
router.use(adsRouter);
router.use(contactRouter);

export default router;
