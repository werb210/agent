import { eventBus } from "../events/eventBus";
import { registerListeners } from "../events/registerListeners";
import { enqueue, queueLength, resetQueue } from "../queue/jobQueue";
import { startWorker, stopWorker } from "../queue/worker";

describe("maya v1 queue", () => {
  beforeEach(() => {
    resetQueue();
  });

  afterEach(() => {
    stopWorker();
    resetQueue();
  });

  it("executes queued jobs", async () => {
    const handler = jest.fn().mockResolvedValue(undefined);

    enqueue({ id: "job-1", type: "document_ocr", payload: { id: "d1" }, createdAt: Date.now() });
    const workerPromise = startWorker(handler);

    await new Promise((resolve) => setTimeout(resolve, 600));
    stopWorker();
    await Promise.race([workerPromise, new Promise((resolve) => setTimeout(resolve, 600))]);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: "job-1", type: "document_ocr" }));
    expect(queueLength()).toBe(0);
  });

  it("enqueues jobs for system events", async () => {
    const spy = jest.spyOn(require("../queue/jobQueue"), "enqueue");
    registerListeners();

    eventBus.emit("document_uploaded", { documentId: "doc-1", documentType: "bank_statement" });
    eventBus.emit("offer_created", { offerId: "off-1" });

    await Promise.resolve();
    await Promise.resolve();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "bank_statement_analysis" }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "offer_notification" }));

    spy.mockRestore();
  });
});
