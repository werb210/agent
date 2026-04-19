import { prisma } from "../config/db.js";

export async function recommendLenders(
  industry: string,
  amount: number,
  probability: number
) {
  const lenders = await prisma.lender.findMany();

  const scored = lenders.map((l: any) => {
    const industryFit = l.preferredIndustry === industry ? 20 : 0;
    const amountFit = amount >= l.minAmount && amount <= l.maxAmount ? 20 : 0;

    const score = industryFit + amountFit + probability / 5;

    return { lender: l.name, score };
  });

  return scored.sort((a: any, b: any) => b.score - a.score);
}
