import documentOcr from "./documentOcr";
import bankStatementAnalysis from "./bankStatementAnalysis";
import applicationSummary from "./applicationSummary";
import offerNotification from "./offerNotification";
import messageNotification from "./messageNotification";

export const jobHandlers = {
  document_ocr: documentOcr,
  bank_statement_analysis: bankStatementAnalysis,
  application_summary: applicationSummary,
  offer_notification: offerNotification,
  message_notification: messageNotification
} as const;

export const handlers = jobHandlers;

export type JobType = keyof typeof jobHandlers;

export async function runJobHandler(jobType: string, payload: unknown): Promise<void> {
  const handler = jobHandlers[jobType as JobType] as ((data: unknown) => Promise<void>) | undefined;

  if (!handler) {
    throw new Error(`Unknown job type: ${jobType}`);
  }

  await handler(payload);
}
