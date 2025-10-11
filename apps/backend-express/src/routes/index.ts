import { Router } from "express";
import authRouter from "./auth.routes";
import qrRouter from "./qr.routes";
import schoolRouter from "./school.routes";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.use("/auth", authLimiter, authRouter);
router.use("/qr", qrRouter);
router.use("/schools", schoolRouter);

export default router;
