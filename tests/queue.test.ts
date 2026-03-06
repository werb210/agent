import { enqueueJob, getQueueLength, resetQueue } from "../src/queue/queue";
import { clearRecentJobs } from "../src/queue/jobDeduper";

describe("queue", () => {
  beforeEach(() => {
    resetQueue();
    clearRecentJobs();
  });

  it("enqueues jobs", () => {
    const job = enqueueJob({ type: "document_ocr", entityId: "doc-1", payload: { ok: true } });

    expect(job).not.toBeNull();
    expect(getQueueLength()).toBe(1);
  });
});
