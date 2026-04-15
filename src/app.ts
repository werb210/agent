import express, { type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { createDependencies } from "./dependencies";
import type { AdapterStatus, RuntimeDependencies } from "./dependencies/types";
import { validateEnv, type EnvValidationStatus } from "./startup/validateEnv";
import voiceRouter from "./routes/voice";
import { mayaRouter } from "./api/maya";

const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function checkTwilio(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

type AppDeps = {
  envStatus?: EnvValidationStatus;
  deps?: RuntimeDependencies;
};

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message || "Internal server error", stack: error.stack };
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return { message: error };
  }

  return { message: "Internal server error" };
}

function readinessFromStatuses(statuses: AdapterStatus[]): "ok" | "error" {
  return statuses.every((status) => status === "ok") ? "ok" : "error";
}

export function createApp(options: AppDeps = {}) {
  const envStatus = options.envStatus ?? validateEnv();
  const dependencies = options.deps ?? createDependencies();
  const app = express();
  if (process.env.NODE_ENV === "production" && ALLOWED_ORIGINS.size === 0) {
    console.warn("[WARN] CORS_ALLOWED_ORIGINS not set — all origins allowed in production");
  }

  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header("x-request-id") || randomUUID();
    const startedAt = Date.now();

    req.requestId = requestId;
    res.locals.requestId = requestId;

    res.setHeader("x-request-id", requestId);

    const requestOrigin = req.header("origin");
    const allowAnyOrigin = ALLOWED_ORIGINS.size === 0;
    const originAllowed = !requestOrigin || allowAnyOrigin || ALLOWED_ORIGINS.has(requestOrigin);

    if (!originAllowed) {
      res.status(403).json({
        status: "error",
        error: "Origin not allowed",
      });
      return;
    }

    if (requestOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowAnyOrigin ? requestOrigin : requestOrigin);
      res.setHeader("Vary", "Origin");
    }

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

  app.options(/.*/, (_req: Request, res: Response) => {
    res.status(204).end();
  });

  app.get("/health", (_req: Request, res: Response) => {
    if (process.env.CI_VALIDATE === "true") {
      return res.status(200).json({ status: "ok" });
    }

    const httpStatus = envStatus.mode === "valid" ? 200 : 503;

    res.status(httpStatus).json({
      status: envStatus.mode === "valid" ? "ok" : "error",
      data: {
        env: envStatus.mode,
        valid: envStatus.valid,
        missingRequired: envStatus.missingRequired,
        missingOptional: envStatus.missingOptional,
      },
    });
  });

  app.get("/ready", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [db, redis, externalApi, openai, twilio] = await Promise.all([
        dependencies.db.status(),
        dependencies.redis.status(),
        dependencies.externalApi.status(),
        dependencies.openai.status(),
        dependencies.twilio.status(),
      ]);

      if (process.env.CI_VALIDATE === "true") {
        return res.status(200).json({ status: "ok" });
      }

      const readiness = readinessFromStatuses([db, redis, externalApi, openai, twilio]);
      const statusCode = readiness === "ok" ? 200 : 503;

      res.status(statusCode).json({
        status: readiness,
        data: {
          db,
          redis,
          externalApi,
          openai,
          twilio,
          twilioConfigured: checkTwilio(),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/voice", voiceRouter);
  app.use(mayaRouter);

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const normalized = normalizeError(error);
    console.error(
      JSON.stringify({
        message: normalized.message,
        requestId: req.requestId || res.locals.requestId,
        stack: normalized.stack,
      }),
    );

    res.status(500).json({
      status: "error",
      error: normalized.message,
    });
  });

  return { app, envStatus, dependencies };
}
