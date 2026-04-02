function getAgentAuthToken(): string {
  const token = process.env.AGENT_API_TOKEN;
  if (!token) {
    throw new Error("MISSING_AUTH");
  }
  return token;
}

export async function createLead(data: any) {
  const token = getAgentAuthToken();

  return {
    status: "ok",
    data,
    tokenUsed: token,
  };
}

export async function executeTool(operationOrCall: string | { name?: string; arguments?: any }, payload?: any) {
  try {
    const operation = typeof operationOrCall === "string" ? operationOrCall : String(operationOrCall?.name || "");
    const input = typeof operationOrCall === "string" ? payload : operationOrCall?.arguments;

    switch (operation) {
      case "createLead":
        return await createLead(input);
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
