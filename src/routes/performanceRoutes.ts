import { Router } from "express";
import { channelPerformance } from "../services/attributionEngine";
import { getLiveScores } from "../services/liveDealScoring";

const router = Router();

router.get("/maya/channel-performance", async (req, res) => {
  const data = await channelPerformance();
  res.json(data);
});

router.get("/maya/live-scores", async (req, res) => {
  const data = await getLiveScores();
  res.json(data);
});

export default router;
