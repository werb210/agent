export const tools = [
  {
    name: "createLead",
    description: "Create a CRM lead record in BF-Server.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" }
      },
      required: ["name", "phone"]
    }
  },
  {
    name: "scheduleAppointment",
    description: "Create a new application/appointment record.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        requestedAmount: { type: "number" }
      },
      required: ["name", "phone"]
    }
  },
  {
    name: "updateCRMRecord",
    description: "Update CRM contact/application metadata.",
    parameters: {
      type: "object",
      properties: {
        contactId: { type: "string" },
        updates: { type: "object" }
      },
      required: ["contactId", "updates"]
    }
  },
  {
    name: "sendSMS",
    description: "Send an SMS to a contact.",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string" },
        message: { type: "string" }
      },
      required: ["phone", "message"]
    }
  },
  {
    name: "transferCall",
    description: "Transfer active call to a live agent.",
    parameters: {
      type: "object",
      properties: {
        callSid: { type: "string" },
        reason: { type: "string" }
      },
      required: ["callSid"]
    }
  }
] as const;
