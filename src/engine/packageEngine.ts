export function buildDealPackage(session: any) {
  return {
    structured: session.structured,
    scoring: session.scoring,
    tier: session.tier,
    product: session.product,
    lenders: session.lenderMatches,
    probability: session.probability,
    checklist: session.checklist
  };
}
