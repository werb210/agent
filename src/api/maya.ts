import { endpoints } from "../lib/endpoints";
import { apiCall } from "../lib/api";

export const mayaEnabled = true;

export async function callMaya(_path: string, payload?: any) {
  const result = await apiCall("/api/v1/maya/message", {
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

export async function sendMessage(userInput: string, authToken?: string): Promise<string> {
  try {
    const response = await apiCall(endpoints.mayaMessage, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
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

    const mayaData = response as {
      reply?: unknown;
      actions?: unknown;
    };

    if (typeof mayaData.reply !== "string") {
      return showFallbackMessage();
    }

    await handleActions(mayaData.actions);
    return mayaData.reply;
  } catch (err) {
    console.error("Agent error:", err);
    return showFallbackMessage();
  }
}
