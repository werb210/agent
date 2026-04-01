import { z } from "zod";

export const CreateLeadSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  businessName: z.string().optional(),
  productType: z.string().optional(),
  message: z.string().optional()
});

export const ScheduleCallSchema = z.object({
  to: z.string()
});

export const UpdateCallStatusSchema = z.object({
  callId: z.string(),
  status: z.enum([
    "initiated",
    "ringing",
    "in-progress",
    "completed",
    "failed"
  ])
});

export const MayaMessageSchema = z.object({
  message: z.string()
});
