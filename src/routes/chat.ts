import express from "express";
import { askMaya } from "../ai";
import { logConversation } from "../serverBridge";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    const reply = await askMaya(message);

    await logConversation({ message, reply, sessionId });

    res.json({
      success: true,
      data: { reply },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "maya_error",
    });
  }
});

export default router;
