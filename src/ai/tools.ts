import { createLeadSchema } from "../tools/schemas";

export const tools = [
  {
    name: "createLead",
    description: "Create a CRM lead record in BF-Server.",
    parameters: createLeadSchema
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
    name: "sendEmail",
    description: "Send an email to a contact.",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" }
      },
      required: ["email", "subject", "body"]
    }
  }
] as const;
