import express, { type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { createDependencies } from "./dependencies";
import type { RuntimeDependencies } from "./dependencies/types";
import { validateEnv, type EnvValidationStatus } from "./startup/validateEnv";

type AppDeps = {
  envStatus?: EnvValidationStatus;
  deps?: RuntimeDependencies;
};

function normalizeError(error: unknown): { message: string } {
  if (error instanceof Error && error.message) {
    return { message: error.message };
  }

  return { message: "Internal server error" };
}

export function createApp(options: AppDeps = {}) {
  const envStatus = options.envStatus ?? validateEnv();
  const dependencies = options.deps ?? createDependencies();
  const app = express();

  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header("x-request-id") || randomUUID();
    const startedAt = Date.now();

    res.setHeader("x-request-id", requestId);
    res.setHeader("Access-Control-Allow-Origin", req.header("origin") || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-request-id");

    res.on("finish", () => {
      console.log(
        JSON.stringify({
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });

    next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
      res.status(204).send();
      return;
    }

    next();
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      data: {
        server: "ok",
        env: envStatus.state,
      },
    });
  });

  app.get("/ready", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [db, redis, externalApi] = await Promise.all([
        dependencies.db.ping(),
        dependencies.redis.ping(),
        dependencies.externalApi.ping(),
      ]);

      const criticalReady = db.state === "available";
      const statusCode = criticalReady ? 200 : 503;

      res.status(statusCode).json({
        status: criticalReady ? "ok" : "error",
        data: {
          db,
          redis,
          externalApi,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const normalized = normalizeError(error);
    res.status(500).json({
      status: "error",
      error: normalized.message,
    });
  });

  return { app, envStatus, dependencies };
}
