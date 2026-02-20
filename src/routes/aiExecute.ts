import { Router } from "express";
import { routeAgent } from "../router/agentRouter";

const router = Router();

router.post("/execute", async (req, res) => {
  try {
    const { task, payload, sessionId } = req.body;

    const result = await routeAgent(task, payload, sessionId);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
