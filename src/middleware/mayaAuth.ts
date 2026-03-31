import { Request, Response, NextFunction } from "express";

export function requireMayaAuth(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.header("x-session-token")?.trim();
  const headerApiKey = req.header("x-api-key")?.trim();
  const authHeader = req.header("authorization")?.trim();
  const bearerApiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  const expectedApiKey = process.env.MAYA_API_KEY?.trim();
  const hasValidApiKey =
    Boolean(expectedApiKey) && (headerApiKey === expectedApiKey || bearerApiKey === expectedApiKey);

  if (sessionToken || hasValidApiKey) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "unauthenticated",
  });
}
