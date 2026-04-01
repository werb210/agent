export const TOOL_REGISTRY = {
  createLead: "createLead",
  startCall: "startCall",
  updateCallStatus: "updateCallStatus"
} as const;

export type ToolRegistryName = keyof typeof TOOL_REGISTRY;
