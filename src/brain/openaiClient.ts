export async function runAI(
  source: string,
  message: string,
  history: any[] = [],
  context: { role?: string } = {}
): Promise<any> {
  void source;
  void message;
  void history;

  if (context?.role && context.role !== "staff" && context.role !== "system") {
    const err: any = new Error("forbidden");
    err.code = "forbidden";
    err.status = 403;
    throw err;
  }

  return { text: "ok" };
}
