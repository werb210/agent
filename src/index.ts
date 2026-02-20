import express from "express";
import dotenv from "dotenv";

import { AgentRequest, AgentResponse } from "./types/agent";
import { verifySignature, isFresh } from "./security/hmac";
import { validatePermissions } from "./security/permissions";
import { validateApiKey } from "./security/apiKeys";
import { routeAgent } from "./router/agentRouter";
import { logger } from "./logging/logger";
import { redisLimiter } from "./security/rateLimiter";

dotenv.config();

const app = express();
app.use(express.json());
app.use(redisLimiter);

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

    const tier = validateApiKey(payload.auth.apiKey);
    if (tier === "PUBLIC" && payload.mode === "SERVER_INTERNAL") {
      throw new Error("PUBLIC tier cannot access SERVER_INTERNAL mode");
    }

    const result = await routeAgent(payload.task, payload.data.payload);

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

    logger.info({ requestId: payload.requestId, task: payload.task });

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
