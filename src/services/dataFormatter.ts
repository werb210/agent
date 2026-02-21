export function formatRateRanges(products: any[]) {
  if (!products.length) {
    return "No active products available at this time.";
  }

  const rates = products.map((p) => ({
    lender: p.lender_name,
    range: `${p.min_rate}% to ${p.max_rate}%`
  }));

  return rates;
}
