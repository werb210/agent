import { executeTool } from "../core/executeTool";
import { serverPost } from "../lib/serverClient";
import {
  CreateLeadSchema,
  ScheduleCallSchema,
  UpdateCallStatusSchema
} from "../schemas/tools";

export async function createLead(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(CreateLeadSchema, (data) => serverPost("/api/lead", data, authToken), payload);
}

export async function startCall(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(ScheduleCallSchema, (data) => serverPost("/api/call/start", data, authToken), payload);
}

export async function updateCallStatus(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(
    UpdateCallStatusSchema,
    (data) => serverPost("/api/voice/status", data, authToken),
    payload
  );
}
