export function matchLenders(data: any, tier: string) {
  if (tier === "A") return ["Prime Capital", "NorthBridge", "Maple Funding"];
  if (tier === "B") return ["Growth Finance", "Velocity Lending"];
  if (tier === "C") return ["AltCap", "BridgeLine"];
  return ["Private Funding Desk"];
}
