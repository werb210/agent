import { Router } from "express";
import { scoreLead } from "../brain/scoring";
import { LeadInput } from "../types/lead";
import { prisma } from "../config/db";

const router = Router();

router.post("/", async (req, res) => {
  const lead: LeadInput = req.body;

  if (!lead.requestedAmount || !lead.industry) {
    return res.status(400).json({
      error: "requestedAmount and industry are required"
    });
  }

  const result = scoreLead(lead);

  const saved = await prisma.leadAnalysis.create({
    data: {
      requestedAmount: lead.requestedAmount,
      industry: lead.industry,
      creditScore: lead.creditScore,
      underwritingReadiness: lead.underwritingReadiness,
      fundingProbability: result.fundingProbability,
      expectedCommission: result.expectedCommission,
      riskLevel: result.riskLevel,
      recommendedAction:
        result.expectedCommission > 10000
          ? "escalate"
          : "review"
    }
  });

  res.json({
    ...result,
    id: saved.id,
    recommendedAction:
      result.expectedCommission > 10000
        ? "escalate"
        : "review"
  });
});

export default router;
