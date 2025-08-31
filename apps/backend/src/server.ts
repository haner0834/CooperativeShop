import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { responseExtender } from "./middleware/response.middleware";
import { configurePassport } from "./config/passport.config";
import apiRoutes from "./routes";
import { globalErrorHandler } from "./middleware/errorHandler.middleware";
import { env } from "./utils/env.utils";
import { basicLimiter } from "./middleware/rateLimit.middleware";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.set("trust proxy", 1);

app.use(responseExtender);

app.use(passport.initialize());
configurePassport();

app.use(basicLimiter);

// --- 路由 ---
app.use("/api", apiRoutes);

// --- 全域錯誤處理中介軟體 (必須放在所有路由之後) ---
app.use(globalErrorHandler);

const PORT = env("PORT", "3000");
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  console.log(`--- NEW Endpoint ---`);
});
