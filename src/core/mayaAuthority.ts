export type MayaRole = "client" | "staff" | "admin";

const rules: Record<MayaRole, string[]> = {
  client: ["ask_question", "book_call"],
  staff: ["ask_question", "view_analytics"],
  admin: ["ask_question", "launch_campaign", "adjust_budget", "view_analytics"]
};

export function validateCommand(role: MayaRole, command: string) {
  return rules[role]?.includes(command);
}
