export const createLeadSchema = {
  type: "object",
  required: ["name", "phone"],
  properties: {
    name: { type: "string" },
    phone: { type: "string" },
    email: { type: "string" }
  }
} as const;
