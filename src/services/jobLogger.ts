export type JobLogStatus = "started" | "completed" | "failed";

export type JobLogRecord = {
  job_id: string;
  job_type: string;
  status: JobLogStatus;
  started_at: string;
  finished_at?: string;
  error?: string;
};

const jobLogs: JobLogRecord[] = [];

export function logJobStarted(jobId: string, jobType: string): JobLogRecord {
  const record: JobLogRecord = {
    job_id: jobId,
    job_type: jobType,
    status: "started",
    started_at: new Date().toISOString()
  };

  jobLogs.push(record);
  return record;
}

export function logJobCompleted(jobId: string): void {
  const record = [...jobLogs].reverse().find((entry) => entry.job_id === jobId && entry.status === "started");
  if (!record) {
    return;
  }

  record.status = "completed";
  record.finished_at = new Date().toISOString();
}

export function logJobFailed(jobId: string, error: unknown): void {
  const record = [...jobLogs].reverse().find((entry) => entry.job_id === jobId && entry.status === "started");
  if (!record) {
    return;
  }

  record.status = "failed";
  record.finished_at = new Date().toISOString();
  record.error = error instanceof Error ? error.message : String(error);
}

export function getJobLogs(): JobLogRecord[] {
  return [...jobLogs];
}

export function clearJobLogs(): void {
  jobLogs.length = 0;
}
