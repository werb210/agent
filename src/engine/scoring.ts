export interface QualificationData {
  fundingAmount?: number;
  monthsInBusiness?: number;
  monthlyRevenue?: number;
  craIssues?: boolean;
}

export function calculateFundingScore(data: QualificationData) {
  let score = 0;

  if (!data.monthsInBusiness) return { score: 0, tier: "C" };

  if (data.monthsInBusiness >= 24) score += 30;
  else if (data.monthsInBusiness >= 12) score += 20;
  else score += 5;

  if (data.monthlyRevenue && data.monthlyRevenue >= 100000)
    score += 30;
  else if (data.monthlyRevenue && data.monthlyRevenue >= 40000)
    score += 20;
  else if (data.monthlyRevenue)
    score += 10;

  if (data.craIssues === false) score += 20;
  if (data.fundingAmount && data.fundingAmount <= 250000)
    score += 20;

  let tier = "C";
  if (score >= 80) tier = "A";
  else if (score >= 60) tier = "B";

  return { score, tier };
}
