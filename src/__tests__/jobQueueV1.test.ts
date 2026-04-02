import { vi } from "vitest";
import { emitter } from "../realtime/emitter";
import { EVENTS } from "../realtime/events";
import { registerListeners } from "../events/registerListeners";
import { enqueue, queueLength, resetQueue } from "../queue/jobQueue";
import { startWorker, stopWorker } from "../queue/worker";
import { setTimeout as sleep } from "node:timers/promises";

describe("maya v1 queue", () => {
  beforeEach(() => {
    resetQueue();
  });

  afterEach(() => {
    stopWorker();
    resetQueue();
  });

  it("executes queued jobs", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    enqueue({ id: "job-1", type: "document_ocr", payload: { id: "d1" }, createdAt: Date.now() });
    const workerPromise = startWorker(handler);

    await sleep(600);
    stopWorker();
    await Promise.race([workerPromise, sleep(600)]);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: "job-1", type: "document_ocr" }));
    expect(queueLength()).toBe(0);
  });

  it("registers listeners once and handles realtime tool events", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    registerListeners();
    registerListeners();

    emitter.emit(EVENTS.TOOL_EXECUTED, { tool: "createLead" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("Tool executed:", { tool: "createLead" });

    logSpy.mockRestore();
  });
});
