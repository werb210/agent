import { Router } from "express";
import OpenAI from "openai";
import { enforcePolicy } from "../core/mayaAccessControl";
import { MayaRole, validateCommand } from "../core/mayaAuthority";
import { logAudit } from "../infrastructure/mayaAudit";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/maya/staff", async (req, res) => {
  try {
    const { message, role, command } = req.body as {
      message?: string;
      role?: MayaRole;
      command?: string;
    };

    if (!message || !role) {
      return res.status(400).json({ error: "message and role are required" });
    }

    if (command && !validateCommand(role, command)) {
      await logAudit("maya", "staff_command_blocked", { role, command });
      return res.status(403).json({ error: "Command not allowed for role" });
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

    if (command) {
      await logAudit("maya", "staff_command_executed", { role, command });
    }

    return res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Maya staff endpoint error:", error);
    return res.status(500).json({ error: "Unable to process Maya staff request" });
  }
});

export default router;
