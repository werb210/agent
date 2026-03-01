import OpenAI from "openai";
import { logLLMUsage } from "../infrastructure/mayaTelemetry";
import { trackLLMUsage } from "../infrastructure/llmCostTracker";
import { AppError } from "../errors/AppError";
import { pool } from "../db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-placeholder" });

export type MayaTaskType =
  | "simple"
  | "analysis"
  | "strategy"
  | "forecast"
  | "ad-copy";

type MayaInvocationMeta = {
  applicationId?: string;
  userId?: string;
  actionType: string;
};

type MayaLLMOptions = {
  responseFormat?: {
    type: "json_schema";
    json_schema: Record<string, unknown>;
  };
  stream?: boolean;
  meta: MayaInvocationMeta;
};

function selectModel(task: MayaTaskType) {
  switch (task) {
    case "simple":
      return "gpt-4o-mini";
    case "analysis":
      return "gpt-4o-mini";
    case "ad-copy":
      return "gpt-4o-mini";
    case "strategy":
      return "gpt-4o";
    case "forecast":
      return "gpt-4o";
    default:
      return "gpt-4o-mini";
  }
}

async function logMayaAudit(payload: {
  applicationId?: string;
  userId?: string;
  actionType: string;
  tokenUsage: number;
  latencyMs: number;
  success: boolean;
}) {
  await pool.query(
    `INSERT INTO maya_audit_logs (application_id, user_id, action_type, token_usage, latency_ms, success)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      payload.applicationId ?? null,
      payload.userId ?? null,
      payload.actionType,
      payload.tokenUsage,
      payload.latencyMs,
      payload.success
    ]
  );
}

export async function runMayaLLM(task: MayaTaskType, prompt: string, options: MayaLLMOptions) {
  const model = selectModel(task);
  const startedAt = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response: any = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 1500,
      response_format: options.responseFormat as any,
      stream: options.stream ?? false
    }, { signal: controller.signal });

    const totalTokens = response.usage?.total_tokens ?? 0;
    if (totalTokens > 6000) {
      throw new Error("token_limit_exceeded");
    }

    const output = response.choices[0].message.content || "";
    if (output.length > 6000) {
      throw new Error("token_limit_exceeded");
    }

    await logLLMUsage(model, task);
    await trackLLMUsage(
      model,
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    );
    await logMayaAudit({
      ...options.meta,
      tokenUsage: totalTokens,
      latencyMs: Date.now() - startedAt,
      success: true
    });

    return {
      model,
      output
    };
  } catch (error) {
    await logMayaAudit({
      ...options.meta,
      tokenUsage: 0,
      latencyMs: Date.now() - startedAt,
      success: false
    });
    if (String(error).includes("token_limit_exceeded")) {
      throw new AppError("token_limit_exceeded", 400, "token_limit_exceeded");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
