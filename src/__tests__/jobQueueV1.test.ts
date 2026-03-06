import { eventBus } from "../events/eventBus";
import { registerSystemEventListeners } from "../events/systemEvents";
import { handlers } from "../jobs";
import { enqueue, getQueueStats, resetQueueForTests } from "../queue/jobQueue";
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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("executes queued jobs", async () => {
    runJobHandler.mockResolvedValue(undefined);

    await enqueue({ id: "job-1", type: "document_ocr", payload: { id: "d1" }, entityId: "d1" });
    await jest.runAllTimersAsync();

    expect(runJobHandler).toHaveBeenCalledWith("document_ocr", { id: "d1" });
    expect(getQueueStats().queue_length).toBe(0);
    expect(getJobLogs()[0]?.status).toBe("completed");
  });

  it("retries failed jobs up to 3 attempts", async () => {
    runJobHandler.mockRejectedValue(new Error("fail"));

    await enqueue({ id: "job-2", type: "document_ocr", payload: { id: "d2" }, entityId: "d2" });
    await jest.runAllTimersAsync();

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
    const spy = jest.spyOn(require("../queue/jobQueue"), "enqueue").mockResolvedValue(undefined);
    registerSystemEventListeners();

    eventBus.emit("document_uploaded", { documentId: "doc-1", documentType: "bank_statement" });
    eventBus.emit("offer_created", { offerId: "off-1" });

    await Promise.resolve();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "bank_statement_analysis", entityId: "doc-1" }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "offer_notification", entityId: "off-1" }));

    spy.mockRestore();
  });
});
