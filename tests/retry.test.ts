import { enqueueJob, resetQueueForTests } from "../src/queue/queue";
import { startWorker, stopWorker } from "../src/queue/worker";

describe("worker retries", () => {
  beforeEach(() => {
    resetQueueForTests();
  });

  afterEach(() => {
    stopWorker();
  });

  it("retries failed jobs up to max attempts", async () => {
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(undefined);

    enqueueJob({ id: "r1", type: "document_ocr", payload: {} });

    const workerPromise = startWorker(handler);
    await new Promise((resolve) => setTimeout(resolve, 700));
    stopWorker();
    await Promise.race([workerPromise, new Promise((resolve) => setTimeout(resolve, 600))]);

    expect(handler).toHaveBeenCalledTimes(3);
  });
});
