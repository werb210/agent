import { executeTool } from "../core/executeTool";
import { endpoints } from "../contracts/endpoints";
import { api } from "../lib/api";
import { MayaMessageSchema } from "../schemas/tools";

export async function sendMessage(message: string, authToken: string): Promise<unknown> {
  return executeTool(
    MayaMessageSchema,
    (data) =>
      api(endpoints.sendMessage, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        ...(data ? { body: data } : {}),
      }),
    { message }
  );
}
