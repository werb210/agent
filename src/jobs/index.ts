import { runDocumentOCR } from "./documentOcr";
import { runBankAnalysis } from "./bankAnalysis";
import { generateSummary } from "./applicationSummary";
import { notifyOffer } from "./offerNotification";
import { notifyMessage } from "./messageNotification";

export const handlers = {
  document_ocr: runDocumentOCR,
  bank_statement_analysis: runBankAnalysis,
  application_summary: generateSummary,
  offer_notification: notifyOffer,
  message_notification: notifyMessage
} as const;

export type JobType = keyof typeof handlers;

export async function runJobHandler(jobType: string, payload: unknown): Promise<void> {
  const handler = handlers[jobType as JobType] as ((data: unknown) => Promise<void>) | undefined;

  if (!handler) {
    throw new Error(`Unknown job type: ${jobType}`);
  }

  await handler(payload);
}
