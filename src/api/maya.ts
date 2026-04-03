import { endpoints } from "../lib/endpoints";
import { apiCall } from "../lib/api";

export const mayaEnabled = true;

export async function callMaya(path: string, payload?: any) {
  const result = await apiCall(path, {
    method: payload ? "POST" : "GET",
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (!result || typeof result !== "object") {
    console.error("INVALID MAYA RESPONSE:", result);
    throw new Error("Invalid Maya response");
  }

  return result;
}

function showFallbackMessage() {
  return "Sorry, something went wrong. Please try again.";
}

async function handleActions(actions: unknown) {
  if (!Array.isArray(actions)) {
    return;
  }

  for (const action of actions) {
    if (!action || typeof action !== "object" || !("type" in action)) {
      continue;
    }

    if ((action as { type?: string }).type === "start_call") {
      const payload = "payload" in action ? (action as { payload?: unknown }).payload : {};
      await apiCall("/api/v1/call/start", {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      });
    }
  }
}

export async function sendMessage(userInput: string, _authToken?: string): Promise<string> {
  try {
    const response = await apiCall(endpoints.mayaMessage, {
      method: "POST",
      body: JSON.stringify({
        message: userInput,
        context: {
          source: "agent",
          timestamp: Date.now(),
        },
      }),
    });

    if (!response || typeof response !== "object") {
      return showFallbackMessage();
    }

    if (!("success" in response) || !("data" in response)) {
      return showFallbackMessage();
    }

    const envelope = response as {
      success?: unknown;
      data?: {
        reply?: unknown;
        actions?: unknown;
      };
    };

    if (envelope.success !== true || !envelope.data || typeof envelope.data.reply !== "string") {
      return showFallbackMessage();
    }

    await handleActions(envelope.data.actions);
    return envelope.data.reply;
  } catch (err) {
    console.error("Agent error:", err);
    return showFallbackMessage();
  }
}
