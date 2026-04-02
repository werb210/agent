import { endpoints } from "../contracts/endpoints";
import { apiFetch } from "../utils/apiClient";

export async function callMaya(path: string, payload?: any) {
  const result = await apiFetch(path, {
    method: payload ? "POST" : "GET",
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (!result || typeof result !== "object") {
    console.error("INVALID MAYA RESPONSE:", result);
    throw new Error("Invalid Maya response");
  }

  return result;
}

export async function sendMessage(message: string, authToken: string): Promise<unknown> {
  if (!authToken) {
    throw new Error("Missing auth token");
  }

  const response = await apiFetch(endpoints.sendMessage, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ message }),
  });

  if (!response || typeof response !== "object") {
    throw new Error("Invalid response");
  }

  return response;
}
