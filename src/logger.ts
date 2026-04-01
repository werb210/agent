export type LogEntry = {
  callId: string;
  operation: string;
  status: string;
  [key: string]: unknown;
};

export function log(entry: LogEntry): void {
  if (!entry.callId || !entry.operation || !entry.status) {
    throw new Error("INVALID_LOG_ENTRY");
  }

  console.log(JSON.stringify(entry));
}
