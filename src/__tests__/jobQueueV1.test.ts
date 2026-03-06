import { eventBus } from "../events/eventBus";
import { registerListeners } from "../events/registerListeners";
import { handlers } from "../jobs";
import { enqueue, getQueueStats, resetQueueForTests } from "../queue/jobQueue";
import { startWorker, stopWorker } from "../queue/worker";
import { clearJobLogs, getJobLogs } from "../services/jobLogger";

jest.mock("../jobs", () => {
  const actual = jest.requireActual("../jobs");

  return {
    ...actual,
    runJobHandler: jest.fn()
  };
});

const { runJobHandler } = jest.requireMock("../jobs") as { runJobHandler: jest.Mock };

describe("maya v1 queue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    runJobHandler.mockReset();
    resetQueueForTests();
    clearJobLogs();
    stopWorker();
  });

  afterEach(() => {
    stopWorker();
    resetQueueForTests();
    jest.useRealTimers();
  });

  it("executes queued jobs", async () => {
    runJobHandler.mockResolvedValue(undefined);

    startWorker({ concurrency: 1 });
    enqueue({ id: "job-1", type: "document_ocr", payload: { id: "d1" }, entityId: "d1", attempts: 0, createdAt: Date.now() });
    await jest.advanceTimersByTimeAsync(600);

    expect(runJobHandler).toHaveBeenCalledWith("document_ocr", { id: "d1" });
    expect(getQueueStats().queue_length).toBe(0);
    expect(getJobLogs()[0]?.status).toBe("completed");
  });

  it("retries failed jobs up to 3 attempts", async () => {
    runJobHandler.mockRejectedValue(new Error("fail"));

    startWorker({ concurrency: 1 });
    enqueue({ id: "job-2", type: "document_ocr", payload: { id: "d2" }, entityId: "d2", attempts: 0, createdAt: Date.now() });
    await jest.advanceTimersByTimeAsync(1800);

    expect(runJobHandler).toHaveBeenCalledTimes(3);
    expect(getJobLogs()[0]?.status).toBe("failed");
  });

  it("registers expected v1 handlers", () => {
    expect(Object.keys(handlers).sort()).toEqual([
      "application_summary",
      "bank_statement_analysis",
      "document_ocr",
      "message_notification",
      "offer_notification"
    ]);
  });

  it("enqueues jobs for system events", async () => {
    const spy = jest.spyOn(require("../queue/jobQueue"), "enqueue");
    registerListeners();

    eventBus.emit("document_uploaded", { documentId: "doc-1", documentType: "bank_statement" });
    eventBus.emit("offer_created", { offerId: "off-1" });

    await Promise.resolve();
    await Promise.resolve();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "bank_statement_analysis", entityId: "doc-1" }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "offer_notification", entityId: "off-1" }));

    spy.mockRestore();
  });
});
