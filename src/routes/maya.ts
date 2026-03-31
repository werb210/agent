import { Router } from "express";
import { generateMayaResponse } from "../ai";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "message_required",
      });
    }

    const reply = await generateMayaResponse(message);

    return res.json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    console.error("maya_chat_error", error);
    return res.status(500).json({
      success: false,
      message: "maya_error",
    });
  }
});

export default router;
