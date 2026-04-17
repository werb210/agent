import { Router, type Request, type Response, type NextFunction } from "express";
import { endpoints } from "../contracts/endpoints";
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
    const response = await apiCall(endpoints.sendMessage, {
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
      throw new Error("sendMessage failed");
    }

    const mayaData = response as { actions?: unknown };
    await handleActions(mayaData.actions);
    return "ok";
  } catch (err) {
    console.error("Agent error:", err);
    throw err;
  }
}

function safeHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}


async function postToBFServer(path: string, payload: unknown) {
  const baseUrl = process.env.SERVER_URL || process.env.BASE_URL;
  if (!baseUrl) throw new Error("SERVER_URL not configured");

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });

  if (!response.ok) {
    throw new Error(`BF-Server request failed: ${response.status}`);
  }

  return response.json().catch(() => null);
}

export const mayaRouter = Router();

mayaRouter.post(
  "/maya/escalate",
  safeHandler(async (req, res) => {
    const { reason, sessionId, applicationId } = req.body ?? {};

    const result = await postToBFServer("/api/chat/escalate", {
      reason: reason ?? "user_requested_human",
      sessionId,
      applicationId,
    });

    res.status(200).json(result ?? { ok: true, sessionId });
  }),
);

mayaRouter.post(
  "/maya/issue",
  safeHandler(async (req, res) => {
    const { message, screenshotBase64, applicationId, sessionId } = req.body ?? {};

    const result = await postToBFServer("/api/issues", {
      message,
      screenshotBase64: screenshotBase64 ?? null,
      applicationId: applicationId ?? null,
      sessionId: sessionId ?? null,
      source: "client_maya",
    });

    res.status(200).json(result ?? { ok: true });
  }),
);
