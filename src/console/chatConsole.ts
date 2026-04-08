import readline from "readline-sync";
import crypto from "crypto";
import { AppError } from "../errors/AppError";

const nativeFetch = globalThis["fetch"];
const AGENT_URL = process.env.AGENT_URL || "http://127.0.0.1:4000/ai/execute";
const rawSecret = process.env.AGENT_SHARED_SECRET;
const rawInternalKey = process.env.AGENT_INTERNAL_KEY;

if (!rawSecret || !rawInternalKey) {
  throw new AppError("internal_error", 500, "Missing required environment variables: AGENT_SHARED_SECRET and AGENT_INTERNAL_KEY");
}

const SECRET = rawSecret;
const INTERNAL_KEY = rawInternalKey;

function sign(body: string) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("hex");
}

async function sendMessage(sessionId: string, message: string) {
  const payload: any = {
    requestId: Date.now().toString(),
    timestamp: Date.now(),
    source: "portal",
    mode: "INTERNAL_TEST",
    task: "chat",
    auth: {
      apiKey: INTERNAL_KEY,
      signature: ""
    },
    session: {
      sessionId,
      role: "admin"
    },
    data: {
      payload: { message }
    }
  };

  const bodyString = JSON.stringify(payload);
  payload.auth.signature = sign(bodyString);

  const response = await nativeFetch(AGENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function startConsole() {
  if (process.env.NODE_ENV !== "production") {
    console.info("Maya AI Console Started");
    console.info("Type 'exit' to quit\n");
  }

  const sessionId = "dev-session";

  while (true) {
    const input = readline.question("You: ").trim();

    if (input.toLowerCase() === "exit") {
      break;
    }

    if (!input) {
      continue;
    }

    try {
      const result = await sendMessage(sessionId, input);

      if (process.env.NODE_ENV !== "production") {
        console.info("\nMaya:", result.result.content);
        console.info("Confidence:", result.confidence);
        console.info("----\n");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error:", message);
    }
  }
}

startConsole().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Fatal console startup error:", message);
  process.exitCode = 1;
  return;
});
