import OpenAI from "openai";
import { ENV } from "./env";

const client = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
});

const AI_TIMEOUT_MS = 12_000;

export type MayaResponseResult =
  | { success: true; reply: string }
  | { success: false; message: "ai_timeout" | "internal_error" };

export async function generateMayaResponse(input: string): Promise<MayaResponseResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Maya, a commercial finance assistant helping qualify and guide applicants.",
          },
          { role: "user", content: input },
        ],
      },
      {
        signal: controller.signal,
      }
    );

    return {
      success: true,
      reply: response.choices[0]?.message?.content ?? "",
    };
  } catch (error) {
    if (controller.signal.aborted) {
      return { success: false, message: "ai_timeout" };
    }

    return { success: false, message: "internal_error" };
  } finally {
    clearTimeout(timeout);
  }
}
