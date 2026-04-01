import { ZodType } from "zod";

export async function executeTool<TInput, TOutput>(
  schema: ZodType<TInput>,
  handler: (payload: TInput) => Promise<TOutput>,
  payload: unknown
): Promise<TOutput> {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid tool payload");
  }

  return handler(parsed.data);
}
