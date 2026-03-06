import { Request, Response, Router } from "express";
import { queueLength } from "../queue/jobQueue";

export function health(_req: Request, res: Response) {
  res.json({
    status: "ok",
    queueLength: queueLength(),
    uptime: process.uptime()
  });
}

export const healthRouter = Router();
healthRouter.get("/agent/health", health);
