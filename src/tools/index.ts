import { executeTool } from "../core/executeTool";
import { serverPost } from "../lib/serverClient";
import { endpoints } from "../contracts/endpoints";
import {
  CreateLeadSchema,
  ScheduleCallSchema,
  UpdateCallStatusSchema
} from "../schemas/tools";

export async function createLead(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(CreateLeadSchema, (data) => serverPost(endpoints.createLead, data, authToken), payload);
}

export async function startCall(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(ScheduleCallSchema, (data) => serverPost(endpoints.startCall, data, authToken), payload);
}

export async function updateCallStatus(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(
    UpdateCallStatusSchema,
    (data) => serverPost(endpoints.updateCallStatus, data, authToken),
    payload
  );
}
