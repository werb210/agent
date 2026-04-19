import { logger } from "../infrastructure/logger.js";
import { Job } from "./jobQueue.js";

type JobStatus = "started" | "completed" | "failed";

type JobLog = {
  job_id: string;
  job_type: string;
  status: JobStatus;
  started_at: string;
  finished_at?: string;
  error?: string;
};

const logs: JobLog[] = [];

export function logJobStarted(job: Job): JobLog {
  const log: JobLog = {
    job_id: job.id,
    job_type: job.type,
    status: "started",
    started_at: new Date().toISOString()
  };

  logs.push(log);
  console.info(log);
  logger.info("job_started", log);
  return log;
}

export function logJobComplete(job: Job): void {
  const log = logs.find((entry) => entry.job_id === job.id && entry.status === "started");
  const finished = new Date().toISOString();

  if (log) {
    log.status = "completed";
    log.finished_at = finished;
    console.info(log);
    logger.info("job_completed", log);
    return;
  }

  const fallback: JobLog = {
    job_id: job.id,
    job_type: job.type,
    status: "completed",
    started_at: finished,
    finished_at: finished
  };

  logs.push(fallback);
  console.info(fallback);
  logger.info("job_completed", fallback);
}

export function logJobFailure(job: Job, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const log = logs.find((entry) => entry.job_id === job.id && entry.status === "started");
  const finished = new Date().toISOString();

  if (log) {
    log.status = "failed";
    log.finished_at = finished;
    log.error = message;
    console.info(log);
    logger.error("job_failed", log);
    return;
  }

  const fallback: JobLog = {
    job_id: job.id,
    job_type: job.type,
    status: "failed",
    started_at: finished,
    finished_at: finished,
    error: message
  };

  logs.push(fallback);
  console.info(fallback);
  logger.error("job_failed", fallback);
}

export function getJobLogs(): JobLog[] {
  return [...logs];
}

export function clearJobLogs(): void {
  logs.length = 0;
}
