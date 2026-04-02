export type MayaToolName =
  | 'createLead'
  | 'updateCRMRecord'
  | 'scheduleAppointment'
  | 'sendSMS'
  | 'sendEmail';

export type MayaToolCall = {
  name: MayaToolName;
  arguments: Record<string, unknown>;
};
