import express from "express";
import { OrchestratorAgent } from "../agents/orchestratorAgent";

const router = express.Router();

router.post("/maya/full-analysis", async (req: any, res) => {
  const role = req.user?.role ?? req.headers["x-maya-role"] ?? "system";
  const orchestrator = new OrchestratorAgent(String(role));
  const result = await orchestrator.runFullAnalysis(req.body);
  res.json(result);
});

export default router;
