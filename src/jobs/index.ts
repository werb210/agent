import type { Job } from "../queue/jobQueue";
import bankStatementAnalysis from "./bankStatementAnalysis";
import processDocumentOcr, { type OcrJob } from "./documentOcr";
import applicationSummary from "./applicationSummary";
import offerNotification from "./offerNotification";
import messageNotification from "./messageNotification";
import { processCallTranscript, type CallTranscriptJob } from "./callTranscript";

export { processCallTranscript } from "./callTranscript";

export const jobHandlers = {
  bankStatementAnalysis,
  documentOcr: processDocumentOcr,
  applicationSummary,
  offerNotification,
  messageNotification,
  processCallTranscript,
};

export const handlers = {
  bank_statement_analysis: bankStatementAnalysis,
  document_ocr: processDocumentOcr,
  application_summary: applicationSummary,
  offer_notification: offerNotification,
  message_notification: messageNotification,
  call_transcript: processCallTranscript,
} as const;

export type JobType = keyof typeof handlers;

export async function runJobHandler(jobType: string, payload: unknown): Promise<void> {
  switch (jobType) {
    case "call_transcript":
      await processCallTranscript(payload as CallTranscriptJob);
      break;
    case "document_ocr":
      await processDocumentOcr(payload as OcrJob);
      break;
    default: {
      const handler = handlers[jobType as JobType] as ((data: unknown) => Promise<unknown>) | undefined;
      if (!handler) {
        throw new Error(`Unknown job type: ${jobType}`);
      }
      await handler(payload);
    }
  }
}

export async function processJob(job: Job): Promise<void> {
  await runJobHandler(job.type, job.payload);
}
