import bankStatementAnalysis from "./bankStatementAnalysis";
import documentOcr from "./documentOcr";
import applicationSummary from "./applicationSummary";
import offerNotification from "./offerNotification";
import messageNotification from "./messageNotification";

export const jobHandlers = {
  bankStatementAnalysis,
  documentOcr,
  applicationSummary,
  offerNotification,
  messageNotification
};

export const handlers = {
  bank_statement_analysis: bankStatementAnalysis,
  document_ocr: documentOcr,
  application_summary: applicationSummary,
  offer_notification: offerNotification,
  message_notification: messageNotification
} as const;

export type JobType = keyof typeof handlers;

export async function runJobHandler(jobType: string, payload: unknown): Promise<void> {
  const handler = handlers[jobType as JobType] as ((data: unknown) => Promise<unknown>) | undefined;

  if (!handler) {
    throw new Error(`Unknown job type: ${jobType}`);
  }

  await handler(payload);
}
