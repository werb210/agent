export const JOB_TYPES = {
  DOCUMENT_OCR: "document_ocr",
  BANK_STATEMENT_ANALYSIS: "bank_statement_analysis",
  APPLICATION_SUMMARY: "application_summary",
  OFFER_NOTIFICATION: "offer_notification",
  MESSAGE_NOTIFICATION: "message_notification"
} as const;

export type SupportedJobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
