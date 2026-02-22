export function simulatePortfolioVolatility(currentValue: number) {
  const simulations = 1000;
  const results: number[] = [];

  for (let i = 0; i < simulations; i++) {
    const randomShock = (Math.random() - 0.5) * 0.2;
    results.push(currentValue * (1 + randomShock));
  }

  const avg = results.reduce((a, b) => a + b, 0) / simulations;
  const worstCase = Math.min(...results);

  return {
    expected_value: avg,
    worst_case_95: worstCase
  };
}
