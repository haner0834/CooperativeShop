import rateLimit from "express-rate-limit";

export const basicLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 35, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    code: "TOO_MANY_REQUEST",
    message: "Too many request, please try again later",
  },
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 12,
  message: {
    status: 429,
    code: "TOO_MANY_REQUEST",
    message: "Too many request, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const qrLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    status: 429,
    code: "TOO_MANY_REQUEST",
    message: "Too many request, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
