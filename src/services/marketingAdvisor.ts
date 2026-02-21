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
