import { getLenderMatchesFromMatrix } from "./lenderMatrixEngine";

export async function matchLenders(data: any, tier: string) {
  const amount = Number(data.funding_amount ?? 0);

  if (amount > 0) {
    const matches = await getLenderMatchesFromMatrix(amount, tier);
    if (matches.length > 0) {
      return matches;
    }
  }

  if (tier === "A") return ["Prime Capital", "NorthBridge", "Maple Funding"];
  if (tier === "B") return ["Growth Finance", "Velocity Lending"];
  if (tier === "C") return ["AltCap", "BridgeLine"];
  return ["Private Funding Desk"];
}
