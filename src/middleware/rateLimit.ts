import rateLimit from "express-rate-limit";
import { NextFunction, Request, Response } from "express";

export const mayaRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

function createMayaChatRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "rate_limited",
    },
  });
}

let mayaChatRateLimiter = createMayaChatRateLimiter();

export function mayaChatRateLimit(req: Request, res: Response, next: NextFunction) {
  return mayaChatRateLimiter(req, res, next);
}

export function resetMayaChatRateLimiter() {
  mayaChatRateLimiter = createMayaChatRateLimiter();
}
