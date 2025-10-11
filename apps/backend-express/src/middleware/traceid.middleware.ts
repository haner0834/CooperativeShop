import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { runWithTrace } from "../utils/traceid.utils";

export const traceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const traceId = (req.headers["x-trace-id"] as string) || randomUUID();
  runWithTrace(traceId, () => next());
};
