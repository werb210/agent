import { Router } from "express";
import OpenAI from "openai";
import { enforcePolicy } from "../core/mayaAccessControl";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/maya/staff", async (req, res) => {
  try {
    const { message, role } = req.body as {
      message?: string;
      role?: "client" | "staff" | "admin";
    };

    if (!message || !role) {
      return res.status(400).json({ error: "message and role are required" });
    }

    const policy = enforcePolicy(role);

    const prompt = `
You are Maya, internal assistant.
Policy:
${JSON.stringify(policy)}

Staff message:
${message}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    return res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Maya staff endpoint error:", error);
    return res.status(500).json({ error: "Unable to process Maya staff request" });
  }
});

export default router;
