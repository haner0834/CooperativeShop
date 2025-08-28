import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { responseExtender } from "./middleware/response.middleware";
import { configurePassport } from "./config/passport.config";
import { AppError } from "./types/error.types";
import apiRoutes from "./routes";
import { globalErrorHandler } from "./middleware/errorHandler.middleware";
import { env } from "./utils/env.utils";

const app = express();

// --- 基礎設定 ---
// 1. CORS: 允許跨域請求，credentials: true 允許 cookie 傳遞
app.use(
  cors({
    origin: "http://localhost:5173", // 換成您的前端 URL
    credentials: true,
  })
);

// 2. Body Parsers: 解析 JSON 和 Cookie
app.use(express.json());
app.use(cookieParser());

// 3. Response Extender: 掛載您自訂的 res.success/fail 方法
app.use(responseExtender);

// 4. Passport: 初始化認證模組
app.use(passport.initialize());
configurePassport();

// --- 路由 ---
app.use("/api", apiRoutes);

// --- 全域錯誤處理中介軟體 (必須放在所有路由之後) ---
app.use(globalErrorHandler);

const PORT = env("PORT", "3000");
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`--- NEW Endpoint ---`);
});
