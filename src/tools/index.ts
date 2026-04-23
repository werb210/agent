import { executeTool } from "../core/executeTool.js";
import { endpoints } from "../contracts/endpoints.js";
import { apiFetch } from "../utils/apiClient.js";
import {
  CreateLeadSchema,
  ScheduleCallSchema,
  UpdateCallStatusSchema
} from "../schemas/tools.js";

function authedPost<T>(path: string, payload: unknown, authToken: string): Promise<T> {
  if (!authToken) {
    throw new Error("Missing auth token");
  }

  return apiFetch(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  }) as Promise<T>;
}

export async function createLead(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(CreateLeadSchema, (data) => authedPost(endpoints.createLead, data, authToken), payload);
}

export async function startCall(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(ScheduleCallSchema, (data) => authedPost(endpoints.startCall, data, authToken), payload);
}

export async function updateCallStatus(payload: unknown, authToken: string): Promise<unknown> {
  return executeTool(
    UpdateCallStatusSchema,
    (data) => authedPost(endpoints.updateCallStatus, data, authToken),
    payload
  );
}

export {
  readApplication,
  listApplications,
  readContact,
  listContacts,
  listLenderProducts,
  listDocumentsForApplication,
} from "./read.js";
