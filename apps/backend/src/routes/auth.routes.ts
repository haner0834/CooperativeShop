import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// --- Credentials Auth ---
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect, authController.logout);

// --- Google OAuth ---
router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

router.post("/refresh", authController.refreshToken);
router.post("/switch-account", authController.switchAccount);
router.post("/restore", authController.restoreSession);

export default router;
