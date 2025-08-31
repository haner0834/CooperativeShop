import { Router } from "express";
import * as qrController from "../controllers/qr.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/generate", protect, qrController.generateUserQrCode);
router.get("/generate-data", protect, qrController.generateUserQrCodeData);
router.post("/verify", qrController.verifyUserQrCode);

export default router;
