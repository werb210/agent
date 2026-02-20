import axios from "axios";
import readline from "readline-sync";
import crypto from "crypto";

const AGENT_URL = "http://localhost:4000/ai/execute";
const rawSecret = process.env.AGENT_SHARED_SECRET;
const rawInternalKey = process.env.AGENT_INTERNAL_KEY;

if (!rawSecret || !rawInternalKey) {
  throw new Error("Missing required environment variables: AGENT_SHARED_SECRET and AGENT_INTERNAL_KEY");
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

  const response = await axios.post(AGENT_URL, payload, {
    timeout: 30000
  });

  return response.data;
}

async function startConsole() {
  console.log("Maya AI Console Started");
  console.log("Type 'exit' to quit\n");

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

      console.log("\nMaya:", result.result.content);
      console.log("Confidence:", result.confidence);
      console.log("----\n");
    } catch (err: any) {
      console.error("Error:", err.response?.data || err.message);
    }
  }
}

void startConsole();
