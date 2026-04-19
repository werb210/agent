import type { Job } from "../queue/jobQueue.js";
import bankStatementAnalysis from "./bankStatementAnalysis.js";
import processDocumentOcr, { type OcrJob } from "./documentOcr.js";
import applicationSummary from "./applicationSummary.js";
import offerNotification from "./offerNotification.js";
import messageNotification from "./messageNotification.js";
import { processCallTranscript, type CallTranscriptJob } from "./callTranscript.js";

export { processCallTranscript } from "./callTranscript.js";

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
