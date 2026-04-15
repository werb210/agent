import { callBFServer } from "../integrations/bfServerClient";
import { logger } from "../infrastructure/logger";

export interface CallTranscriptJob {
  callSid: string;
  transcript: string;
  summary?: string;
  score?: number;
  crmContactId?: string;
  applicationId?: string;
}

export async function processCallTranscript(job: CallTranscriptJob): Promise<void> {
  try {
    await callBFServer("/api/calls/transcript", {
      callSid: job.callSid,
      transcript: job.transcript,
      summary: job.summary ?? null,
      score: job.score ?? null,
      crmContactId: job.crmContactId ?? null,
      applicationId: job.applicationId ?? null,
    });

    logger.info("call_transcript_posted", { callSid: job.callSid });
  } catch (err) {
    logger.error("call_transcript_post_failed", { callSid: job.callSid, err });
    throw err;
  }
}
