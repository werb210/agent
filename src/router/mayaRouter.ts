import { Router } from "express";
import { MayaRequest, MayaResponse } from "../types/maya";
import { handleClientMode } from "../services/modes/clientMode";
import { handleStaffMode } from "../services/modes/staffMode";
import { handleMarketingMode } from "../services/modes/marketingMode";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const body: MayaRequest = req.body;

    if (!body.mode || !body.sessionId || !body.message) {
      return res.status(400).json({ error: "Invalid Maya request" });
    }

    let result: MayaResponse;

    switch (body.mode) {
      case "client":
        result = await handleClientMode(body);
        break;
      case "staff":
        result = await handleStaffMode(body);
        break;
      case "marketing":
        result = await handleMarketingMode(body);
        break;
      default:
        return res.status(400).json({ error: "Unknown mode" });
    }

    return res.json(result);
  } catch (error) {
    console.error("Maya router error:", error);
    return res.status(500).json({
      reply: "System error. Please try again.",
      confidence: 0,
      escalated: false
    });
  }
});

export default router;
