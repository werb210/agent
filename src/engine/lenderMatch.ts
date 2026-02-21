export interface LenderMatchResult {
  lender: string;
  likelihood: number;
}

export function matchLenders(score: number, revenue?: number): LenderMatchResult[] {
  const lenders: LenderMatchResult[] = [];

  if (score >= 80) {
    lenders.push({ lender: "Prime Capital", likelihood: 0.92 });
    lenders.push({ lender: "NorthBridge LOC", likelihood: 0.88 });
  } else if (score >= 60) {
    lenders.push({ lender: "Summit Funding", likelihood: 0.74 });
    lenders.push({ lender: "GrowthLine Finance", likelihood: 0.68 });
  } else {
    lenders.push({ lender: "AltEdge Capital", likelihood: 0.52 });
  }

  return lenders;
}
