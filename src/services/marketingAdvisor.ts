import { RoiSummary } from "./roiEngine";

export function suggestAdjustments(roiData: RoiSummary): string[] {
  const suggestions: string[] = [];

  for (const source in roiData) {
    const channel = roiData[source];

    if (channel.leads > 20 && channel.bookings < 5) {
      suggestions.push(`Consider refining targeting for ${source}.`);
    }

    if (channel.funded > 5) {
      suggestions.push(`Increase budget allocation to ${source}.`);
    }
  }

  return suggestions;
}

export function getCappedBudgetAdjustment(
  suggestedPercent: number,
  settings: {
    autonomy_level: number;
    allow_ad_adjustment: boolean;
    max_auto_budget_adjust_percent: number;
  }
): number | null {
  if (settings.autonomy_level >= 4 && settings.allow_ad_adjustment) {
    return Math.min(
      suggestedPercent,
      settings.max_auto_budget_adjust_percent
    );
  }

  return null;
}
