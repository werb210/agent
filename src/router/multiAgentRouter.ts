import express from "express";
import { OrchestratorAgent } from "../agents/orchestratorAgent";

const router = express.Router();
const orchestrator = new OrchestratorAgent();

router.post("/maya/full-analysis", async (req, res) => {
  const result = await orchestrator.runFullAnalysis(req.body);
  res.json(result);
});

export default router;
