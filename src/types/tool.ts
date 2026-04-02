export type MayaToolName =
  | "createLead"
  | "updateCRMRecord"
  | "scheduleAppointment"
  | "sendSMS"
  | "sendEmail";

export type MayaToolPayloads = {
  createLead: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  updateCRMRecord: {
    id: string;
    fields: Record<string, unknown>;
  };
  scheduleAppointment: {
    leadId: string;
    datetime: string;
  };
  sendSMS: {
    to: string;
    message: string;
  };
  sendEmail: {
    to: string;
    subject: string;
    body: string;
  };
};

export type MayaToolCall<T extends MayaToolName = MayaToolName> = {
  name: T;
  payload: MayaToolPayloads[T];
};
