import { enqueueJob, getQueueLength, resetQueueForTests } from "../src/queue/queue.js";

describe("queue", () => {
  beforeEach(() => {
    resetQueueForTests();
  });

  it("enqueues jobs", () => {
    const job = enqueueJob({ type: "document_ocr", payload: { ok: true } });

    expect(job).not.toBeNull();
    expect(getQueueLength()).toBe(1);
  });
});
