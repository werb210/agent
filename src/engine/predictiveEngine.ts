export function advancedApprovalPredictor(deal: any) {
  const revenueWeight = Number(deal?.monthly_revenue ?? 0) / 100000;
  const tenureWeight = Number(deal?.time_in_business_months ?? 0) / 60;
  const scoreWeight = Number(deal?.score ?? 0) / 100;

  let probability = (revenueWeight * 0.4) +
                    (tenureWeight * 0.3) +
                    (scoreWeight * 0.3);

  if (probability > 0.92) probability = 0.92;
  if (probability < 0.08) probability = 0.08;

  return Number(probability.toFixed(2));
}

export function closingProbabilityFromVelocity(events: Array<{ event_type: string; created_at: string | Date }>) {
  const created = events
    .map((e) => ({ ...e, at: new Date(e.created_at).getTime() }))
    .filter((e) => Number.isFinite(e.at))
    .sort((a, b) => a.at - b.at);

  if (created.length < 2) {
    return 0.35;
  }

  const start = created[0].at;
  const firstResponse = created.find((e) => e.event_type === "FIRST_RESPONSE")?.at ?? start + 48 * 3600 * 1000;
  const docUpload = created.find((e) => e.event_type === "DOCUMENT_UPLOADED")?.at ?? start + 96 * 3600 * 1000;
  const lenderSend = created.find((e) => e.event_type === "SENT_TO_LENDER")?.at ?? start + 120 * 3600 * 1000;

  const firstResponseDays = Math.max((firstResponse - start) / (24 * 3600 * 1000), 0.25);
  const docUploadDays = Math.max((docUpload - start) / (24 * 3600 * 1000), 0.25);
  const lenderSendDays = Math.max((lenderSend - start) / (24 * 3600 * 1000), 0.25);

  let score = 0.9 - (firstResponseDays * 0.12) - (docUploadDays * 0.08) - (lenderSendDays * 0.06);
  if (score > 0.92) score = 0.92;
  if (score < 0.08) score = 0.08;

  return Number(score.toFixed(2));
}
