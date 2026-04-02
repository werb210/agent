import { executeTool } from "../core/executeTool";
import { serverPost } from "../lib/serverClient";
import { MayaMessageSchema } from "../schemas/tools";

export async function sendMessage(message: string, authToken: string): Promise<unknown> {
  return executeTool(MayaMessageSchema, (data) => serverPost("/api/maya/message", data, authToken), { message });
}
