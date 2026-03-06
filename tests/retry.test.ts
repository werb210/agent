import { enqueueJob, resetQueue } from "../src/queue/queue";
import { clearJobLogs, getJobLogs } from "../src/queue/jobLogger";
import { startWorker, stopWorker } from "../src/queue/worker";

jest.mock("../src/jobs", () => ({
  runJobHandler: jest.fn()
}));

const { runJobHandler } = jest.requireMock("../src/jobs") as { runJobHandler: jest.Mock };

describe("worker retries", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetQueue();
    clearJobLogs();
    stopWorker();
    runJobHandler.mockReset();
  });

  afterEach(() => {
    stopWorker();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("retries failed jobs up to max attempts", async () => {
    runJobHandler.mockRejectedValue(new Error("fail"));
    enqueueJob({ id: "r1", type: "document_ocr", entityId: "doc-r1", payload: {} });

    startWorker({ concurrency: 1 });
    await jest.advanceTimersByTimeAsync(500);

    expect(runJobHandler).toHaveBeenCalledTimes(3);
    const logs = getJobLogs();
    expect(logs[logs.length - 1]?.status).toBe("failed");
  });
});
