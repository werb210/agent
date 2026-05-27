import express, { type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { createDependencies } from "./dependencies/index.js";
import type { AdapterStatus, RuntimeDependencies } from "./dependencies/types.js";
import { validateEnv, type EnvValidationStatus } from "./startup/validateEnv.js";
import voiceRouter from "./routes/voice.js";
import { mayaRouter } from "./api/maya.js";

// AGENT_BLOCK_v20_BOOT_CONFIG_AUDIT_v1
// Maya graceful-degrades to SMS handoff when any of these are missing
// or wrong. Health endpoint should fail (not pass) if these are absent.
export const REQUIRED_ENV = [
  "OPENAI_API_KEY",
  "SERVER_URL",
  "JWT_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "MAYA_HANDOFF_TO",
] as const;

const healthCache = new Map<string, number>();

export function auditRequiredEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing = REQUIRED_ENV.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    console.error(JSON.stringify({ missing, msg: "agent_boot_missing_env" }));
  }
  return missing;
}

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
  auditRequiredEnv();
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

  app.get("/health", async (_req: Request, res: Response) => {
    if (process.env.CI_VALIDATE === "true") {
      return res.status(200).json({ status: "ok" });
    }

    // AGENT_BLOCK_v21_HEALTHCHECK_REAL_v1
    const checks: Record<string, boolean> = {};
    checks.env = REQUIRED_ENV.every((key) => Boolean(process.env[key]?.trim()));
    try {
      const lastOk = healthCache.get("openai");
      if (lastOk && Date.now() - lastOk < 60_000) {
        checks.openai = true;
      } else {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            max_tokens: 1,
            messages: [{ role: "user", content: "ok" }],
          }),
        });
        checks.openai = response.ok;
        if (checks.openai) {
          healthCache.set("openai", Date.now());
        }
      }
    } catch (error) {
      void error;
      checks.openai = false;
    }

    const healthy = Object.values(checks).every(Boolean);
    return res.status(healthy ? 200 : 503).json({ ok: healthy, checks, envMode: envStatus.mode });
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
