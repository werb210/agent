type LtvPayload = {
  product_type?: string;
  funding_amount: number;
};

export function calculateDealLTV(payload: LtvPayload) {
  const repeatProbability = payload.product_type === "LOC" ? 0.6 : 0.25;
  const averageUpsellMultiplier = 1.4;

  const baseCommission = payload.funding_amount * 0.03;
  const ltv = baseCommission * (1 + repeatProbability * averageUpsellMultiplier);

  return ltv;
}
