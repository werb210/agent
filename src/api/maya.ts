import { executeTool } from "../core/executeTool";
import { serverPost } from "../lib/serverClient";
import { endpoints } from "../contracts/endpoints";
import { MayaMessageSchema } from "../schemas/tools";

export async function sendMessage(message: string, authToken: string): Promise<unknown> {
  return executeTool(MayaMessageSchema, (data) => serverPost(endpoints.sendMessage, data, authToken), { message });
}
