import { Router } from "express";
import { prisma } from "../config/db";

const router = Router();

router.post("/", async (req, res) => {
  const { leadId, outcome, booked, funded, fundedAmount } = req.body;

  const result = await prisma.callOutcome.create({
    data: {
      leadId,
      outcome,
      booked,
      funded,
      fundedAmount
    }
  });

  res.json(result);
});

export default router;
