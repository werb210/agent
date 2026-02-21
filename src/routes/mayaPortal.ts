import { Router } from "express";
import { enforcePolicy } from "../core/mayaAccessControl";
import { MayaRole, validateCommand } from "../core/mayaAuthority";
import { logAudit } from "../infrastructure/mayaAudit";
import { calculateConfidence } from "../core/mayaConfidence";
import { resilientLLM } from "../infrastructure/mayaResilience";

const router = Router();

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

    const result = await resilientLLM("analysis", prompt);

    if (command) {
      await logAudit("maya", "staff_command_executed", { role, command });
    }

    return res.json({
      reply: result.output,
      confidence: calculateConfidence(result.output),
      model: result.model
    });
  } catch (error) {
    console.error("Maya staff endpoint error:", error);
    return res.status(500).json({ error: "Unable to process Maya staff request" });
  }
});

export default router;
