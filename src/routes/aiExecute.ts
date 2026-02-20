import { Router } from "express";
import { routeAgent } from "../router/agentRouter";
import crypto from "crypto";

const router = Router();

router.post("/execute", async (req, res) => {
  try {
    const {
      requestId,
      timestamp,
      source,
      mode,
      task,
      auth,
      session,
      data
    } = req.body;

    if (!task || !auth?.apiKey || !auth?.signature) {
      return res.status(400).json({ error: "Invalid request schema" });
    }

    // Recreate signature
    const rawSecret = process.env.AGENT_SHARED_SECRET;
    if (!rawSecret) {
      return res.status(500).json({ error: "Server secret not configured" });
    }

    const bodyString = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", rawSecret)
      .update(bodyString)
      .digest("hex");

    if (expectedSignature !== auth.signature) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const result = await routeAgent(
      task,
      data?.payload,
      session?.sessionId
    );

    return res.json({
      success: true,
      result,
      confidence: 0.82
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
