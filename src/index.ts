import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { AgentRequest, AgentResponse } from "./types/agent";
import { verifySignature, isFresh } from "./security/hmac";
import { validatePermissions } from "./security/permissions";
import { routeAgent } from "./router/agentRouter";
import { logAgentEvent } from "./logging/logger";

dotenv.config();

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});

app.use(limiter);

app.post("/ai/execute", async (req, res) => {
  const start = Date.now();

  try {
    const bodyString = JSON.stringify(req.body);
    const payload = req.body as AgentRequest;

    if (!verifySignature(bodyString, payload.auth.signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    if (!isFresh(payload.timestamp)) {
      return res.status(401).json({ error: "Stale request" });
    }

    validatePermissions(payload.mode, payload.task);

    const result = routeAgent(payload.task);

    const response: AgentResponse = {
      requestId: payload.requestId,
      status: "success",
      mode: payload.mode,
      task: payload.task,
      version: "1.0.0",
      confidence: 80,
      result,
      suggestedAction: {
        type: "none",
        confidence: 0
      },
      metrics: {
        latencyMs: Date.now() - start
      }
    };

    logAgentEvent({
      requestId: payload.requestId,
      mode: payload.mode,
      task: payload.task,
      confidence: response.confidence
    });

    res.json(response);
  } catch (err: any) {
    res.status(403).json({
      status: "error",
      message: err.message
    });
  }
});

app.listen(4000, () => {
  console.log("Agent service running on port 4000");
});
