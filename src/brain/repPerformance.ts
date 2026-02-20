export type RepPerformanceInput = {
  assigned: number;
  funded: number;
  totalRevenue: number;
};

export function calculateRepEfficiency(rep: RepPerformanceInput) {
  if (rep.assigned <= 0 || rep.funded <= 0) {
    return 0;
  }

  const closeRate = rep.funded / rep.assigned;
  const avgRevenue = rep.totalRevenue / rep.funded;

  return closeRate * avgRevenue;
}
