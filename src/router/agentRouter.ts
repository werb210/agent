export function routeAgent(task: string) {
  switch (task) {
    case "chat":
      return { content: "Chat response placeholder" };

    case "intake":
      return { structured: { status: "intake processed" } };

    case "memo":
      return { content: "Underwriting memo placeholder" };

    case "recommend":
      return { lenders: [] };

    case "forecast":
      return { projectedRevenue: 0 };

    case "optimize":
      return { strategy: "optimize" };

    default:
      throw new Error("Invalid task");
  }
}
