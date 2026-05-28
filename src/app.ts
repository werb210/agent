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

// AGENT_BLOCK_v317_CORS_FAIL_CLOSED_v1
// Known Boreal surfaces the Maya widget loads on. Used as the fail-closed
// default in production when CORS_ALLOWED_ORIGINS is unset, so a missing
// env var no longer means "reflect any origin on the internet". An
// explicit CORS_ALLOWED_ORIGINS always takes precedence. Resolution is
// done per-createApp (below) rather than at module load so it's testable
// and respects the env in force when the app is built.
const DEFAULT_PROD_ORIGINS = [
  "https://boreal.financial",
  "https://www.boreal.financial",
  "https://staff.boreal.financial",
  "https://client.boreal.financial",
] as const;

function resolveAllowedOrigins(env: NodeJS.ProcessEnv = process.env): { allowed: Set<string>; allowAny: boolean; usingDefaults: boolean } {
  const configured = new Set(
    (env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const isProd = env.NODE_ENV === "production";
  if (configured.size > 0) return { allowed: configured, allowAny: false, usingDefaults: false };
  if (isProd) return { allowed: new Set<string>(DEFAULT_PROD_ORIGINS), allowAny: false, usingDefaults: true };
  // Non-production with nothing configured: allow any origin (dev convenience).
  return { allowed: new Set<string>(), allowAny: true, usingDefaults: false };
}

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
  // AGENT_BLOCK_v317_CORS_FAIL_CLOSED_v1
  const { allowed: allowedOrigins, allowAny: allowAnyOrigin, usingDefaults } = resolveAllowedOrigins();
  if (usingDefaults) {
    console.warn(
      `[WARN] CORS_ALLOWED_ORIGINS not set — failing closed to default Boreal origins: ${DEFAULT_PROD_ORIGINS.join(", ")}`,
    );
  }

  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header("x-request-id") || randomUUID();
    const startedAt = Date.now();

    req.requestId = requestId;
    res.locals.requestId = requestId;

    res.setHeader("x-request-id", requestId);

    const requestOrigin = req.header("origin");
    const originAllowed = !requestOrigin || allowAnyOrigin || allowedOrigins.has(requestOrigin);

    if (!originAllowed) {
      res.status(403).json({
        status: "error",
        error: "Origin not allowed",
      });
      return;
    }

    if (requestOrigin) {
      // Origin is allowed at this point; echo it back.
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
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

  app.get("/health", async (req: Request, res: Response) => {
    if (process.env.CI_VALIDATE === "true") {
      return res.status(200).json({ status: "ok" });
    }

    // AGENT_BLOCK_v317_HEALTH_LIVENESS_READINESS_v1
    // Two distinct probes, resolved off the VALIDATED env (envStatus),
    // not raw process.env, so test-injected env is honored:
    //   - shallow  GET /health        → LIVENESS. Cheap, no network call.
    //     Stays 200 even when degraded (e.g. OPENAI_API_KEY missing) so the
    //     orchestrator does not recycle a container that is actually
    //     serving traffic. Reports {status:"ok"|"degraded"}.
    //   - deep     GET /health?deep=1 → READINESS. Verifies OpenAI is
    //     configured and reachable; 503 {reason} otherwise, so traffic is
    //     held back until the dependency is live.
    const deep = req.query.deep === "1" || req.query.deep === "true";
    const openaiMissing = envStatus.missingRequired.includes("OPENAI_API_KEY");

    if (!deep) {
      const status = envStatus.missingRequired.length === 0 ? "ok" : "degraded";
      return res.status(200).json({ status, envMode: envStatus.mode });
    }

    if (openaiMissing) {
      return res.status(503).json({ status: "unhealthy", reason: "openai_not_configured" });
    }

    let openaiOk = false;
    try {
      const lastOk = healthCache.get("openai");
      if (lastOk && Date.now() - lastOk < 60_000) {
        openaiOk = true;
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
        openaiOk = response.ok;
        if (openaiOk) {
          healthCache.set("openai", Date.now());
        }
      }
    } catch (error) {
      void error;
      openaiOk = false;
    }

    if (!openaiOk) {
      return res.status(503).json({ status: "unhealthy", reason: "openai_unreachable" });
    }
    return res.status(200).json({ status: "ok", envMode: envStatus.mode });
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
