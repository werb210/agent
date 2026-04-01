export const tools = [
  {
    name: "createLead",
    description: "Create a CRM lead record.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        phone: { type: "string" },
        businessName: { type: "string" },
        productType: { type: "string" },
        message: { type: "string" }
      },
      required: ["name", "email", "phone"]
    }
  },
  {
    name: "startCall",
    description: "Start outbound call.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string" }
      },
      required: ["to"]
    }
  },
  {
    name: "updateCallStatus",
    description: "Update status for an active call.",
    parameters: {
      type: "object",
      properties: {
        callId: { type: "string" },
        status: {
          type: "string",
          enum: ["initiated", "ringing", "in-progress", "completed", "failed"]
        }
      },
      required: ["callId", "status"]
    }
  }
] as const;
