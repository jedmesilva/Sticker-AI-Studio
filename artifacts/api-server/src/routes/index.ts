import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stickersRouter from "./stickers";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stickersRouter);
router.use(openaiRouter);

export default router;
