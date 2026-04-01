export type LogEntry = {
  callId: string;
  operation: string;
  status: string;
  [key: string]: unknown;
};

export const log = Object.freeze(function(entry: LogEntry): void {
  if (
    !entry ||
    typeof entry !== "object" ||
    !entry.callId ||
    !entry.operation ||
    !entry.status
  ) {
    throw new Error("INVALID_LOG_ENTRY");
  }

  console.log(JSON.stringify(entry));
});
