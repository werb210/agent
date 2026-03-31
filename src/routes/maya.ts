import { Router } from "express";
import rateLimit from "express-rate-limit";
import { generateMayaResponse } from "../ai";
import { logger } from "../infrastructure/logger";
import { triggerMayaIntegrations } from "../integrations/mayaIntegrations";
import { requireMayaAuth } from "../middleware/mayaAuth";

const router = Router();
const MAX_MESSAGE_LENGTH = 2000;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "rate_limited",
  },
});

router.post("/chat", chatLimiter, requireMayaAuth, async (req, res) => {
  const start = Date.now();
  const rawMessage = req.body?.message;
  const safePreview = typeof rawMessage === "string" ? rawMessage.slice(0, 120) : "[non-string]";

  logger.info("maya_chat_request", {
    ip: req.ip,
    messagePreview: safePreview,
  });

  try {
    if (typeof rawMessage !== "string") {
      return res.status(400).json({ success: false, message: "invalid_input" });
    }

    const message = rawMessage.trim();

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, message: "invalid_input" });
    }

    const aiResult = await generateMayaResponse(message);

    if (!aiResult.success) {
      const statusCode = aiResult.message === "ai_timeout"
        ? 504
        : aiResult.message === "ai_not_configured"
          ? 503
          : 500;
      logger.warn("maya_chat_ai_failure", {
        outcome: aiResult.message,
        durationMs: Date.now() - start,
      });
      return res.status(statusCode).json({ success: false, message: aiResult.message });
    }

    triggerMayaIntegrations(message);

    logger.info("maya_chat_response", {
      outcome: "success",
      durationMs: Date.now() - start,
    });

    return res.json({
      success: true,
      data: { reply: aiResult.reply },
    });
  } catch (error) {
    logger.error("maya_chat_error", {
      err: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - start,
    });

    return res.status(500).json({
      success: false,
      message: "internal_error",
    });
  }
});

export default router;
