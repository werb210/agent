export function generatePreApprovalSummary(data: any, tier: string, lenders: any[]) {
  return `
Boreal Pre-Approval Snapshot

Tier: ${tier}
Funding Requested: ${data.fundingAmount}
Months in Business: ${data.monthsInBusiness}
Monthly Revenue: ${data.monthlyRevenue}
CRA Issues: ${data.craIssues ? "Yes" : "No"}

Top Lender Matches:
${lenders.map((l) => `${l.lender} (${Math.round(l.likelihood * 100)}%)`).join("\n")}
`;
}
