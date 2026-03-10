import { Router } from "express";
import { prisma } from "../config/db";

const router = Router();

router.get("/", async (_, res) => {
  const deals = await prisma.leadAnalysis.findMany();

  const ranked = deals.sort(
    (a: any, b: any) => b.expectedCommission - a.expectedCommission
  );

  res.json(ranked);
});

export default router;
