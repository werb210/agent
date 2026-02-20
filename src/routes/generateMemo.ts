import { Router } from "express";
import { generateUnderwritingMemo } from "../brain/underwriterAgent";

const router = Router();

router.post("/", async (req, res) => {
  const { requestedAmount, industry, revenue, creditScore, readiness } = req.body;

  if (!requestedAmount || !industry) {
    return res.status(400).json({
      error: "requestedAmount and industry are required"
    });
  }

  const memo = await generateUnderwritingMemo({
    requestedAmount: Number(requestedAmount),
    industry,
    revenue,
    creditScore,
    readiness
  });

  return res.json({ memo });
});

export default router;
