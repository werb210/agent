import { executeTool } from "../core/executeTool";
import { retryWithBackoff } from "../lib/retry";
import { serverPost } from "../lib/serverClient";
import {
  CreateLeadSchema,
  ScheduleCallSchema,
  UpdateCallStatusSchema
} from "../schemas/tools";

export async function createLead(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(
    CreateLeadSchema,
    (data) => retryWithBackoff(() => serverPost("/api/lead", data, authToken)),
    payload
  );
}

export async function startCall(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(
    ScheduleCallSchema,
    (data) => retryWithBackoff(() => serverPost("/api/call/start", data, authToken)),
    payload
  );
}

export async function updateCallStatus(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(
    UpdateCallStatusSchema,
    (data) => retryWithBackoff(() => serverPost("/api/voice/status", data, authToken)),
    payload
  );
}
