import { Router } from "express";
import { scoreLead } from "../brain/scoring";
import { LeadInput } from "../types/lead";

const router = Router();

router.post("/", (req, res) => {
  const lead: LeadInput = req.body;

  if (!lead.requestedAmount || !lead.industry) {
    return res.status(400).json({
      error: "requestedAmount and industry are required"
    });
  }

  const result = scoreLead(lead);

  res.json({
    ...result,
    recommendedAction:
      result.expectedCommission > 10000
        ? "escalate"
        : "review"
  });
});

export default router;
