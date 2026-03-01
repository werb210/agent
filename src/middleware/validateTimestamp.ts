import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

const MAX_DRIFT = 5 * 60 * 1000;

export function validateTimestamp(req: Request, _res: Response, next: NextFunction) {
  const ts = Number(req.headers["x-request-timestamp"]);

  if (!ts || Math.abs(Date.now() - ts) > MAX_DRIFT) {
    throw new AppError("expired_request", 401);
  }

  next();
}
