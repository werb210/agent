import OpenAI from "openai";
import { logLLMUsage } from "../infrastructure/mayaTelemetry";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-placeholder" });

export type MayaTaskType =
  | "simple"
  | "analysis"
  | "strategy"
  | "forecast"
  | "ad-copy";

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

export async function runMayaLLM(task: MayaTaskType, prompt: string) {
  const model = selectModel(task);

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4
  });

  await logLLMUsage(model, task);

  return {
    model,
    output: response.choices[0].message.content || ""
  };
}
