export const TOOL_REGISTRY = {
  createLead: "createLead",
  startCall: "startCall",
  updateCallStatus: "updateCallStatus",
  readApplication: "readApplication",
  listApplications: "listApplications",
  readContact: "readContact",
  listContacts: "listContacts",
  listLenderProducts: "listLenderProducts",
  listDocumentsForApplication: "listDocumentsForApplication",
} as const;

export type ToolRegistryName = keyof typeof TOOL_REGISTRY;
