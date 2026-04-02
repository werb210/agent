import { apiFetch } from "../utils/apiClient";

export async function executeTool(
  operationOrCall: string | { name?: string; arguments?: any },
  payload?: any
) {
  try {
    const operation = typeof operationOrCall === "string"
      ? operationOrCall
      : String(operationOrCall?.name || "");
    const input = typeof operationOrCall === "string"
      ? payload
      : operationOrCall?.arguments;

    switch (operation) {
      case "createLead": {
        const res = await apiFetch("/api/v1/leads", {
          method: "POST",
          body: JSON.stringify(input),
        });

        return {
          status: "ok",
          data: res,
        };
      }

      default:
        throw new Error("UNKNOWN_OPERATION");
    }
  } catch (err: any) {
    return {
      status: "error",
      error: err.message,
    };
  }
}
