export function routeAgent(task: string) {
  switch (task) {
    case "intake":
      return "maya";
    case "memo":
      return "underwriter";
    case "marketing":
      return "marketing";
    case "optimize":
      return "optimizer";
    default:
      return "maya";
  }
}
