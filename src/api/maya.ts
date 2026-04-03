import { endpoints } from "../lib/endpoints";
import { apiCall } from "../lib/api";

export async function callMaya(path: string, payload?: any) {
  const result = await apiCall(path, {
    method: payload ? "POST" : "GET",
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (!result || typeof result !== "object") {
    console.error("INVALID MAYA RESPONSE:", result);
    throw new Error("Invalid Maya response");
  }

  return result;
}

export async function sendMessage(message: string, _authToken?: string): Promise<unknown> {
  const response = await apiCall(endpoints.mayaMessage, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

  if (!response || typeof response !== "object") {
    throw new Error("Invalid response");
  }

  if ((response as any).status === "ok") {
    return (response as any).data;
  }

  return response;
}
