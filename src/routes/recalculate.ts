import { Router } from "express";
import { calculateIndustryPerformance } from "../brain/adaptiveWeights";

const router = Router();

router.post("/", async (_, res) => {
  await calculateIndustryPerformance();
  res.json({ status: "Performance metrics recalculated" });
});

export default router;
