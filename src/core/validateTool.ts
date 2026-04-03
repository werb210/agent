import { z } from 'zod';

export const toolSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.any()),
});

export function validateToolCall(input: unknown) {
  return toolSchema.parse(input);
}
