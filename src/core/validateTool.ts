import { z } from "zod";
import { MayaToolCall, MayaToolName } from "../types/tool";

const toolNameSchema = z.enum([
  "createLead",
  "updateCRMRecord",
  "scheduleAppointment",
  "sendSMS",
  "sendEmail"
]);

const baseSchema = z.object({
  name: toolNameSchema,
  payload: z.record(z.any())
});

export function validateToolCall(input: unknown): MayaToolCall {
  const parsed = baseSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid tool call structure");
  }

  return parsed.data as MayaToolCall<MayaToolName>;
}
