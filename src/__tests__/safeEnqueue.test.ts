import * as queueModule from "../queue/queue.js";
import { safeEnqueue } from "../queue/safeEnqueue.js";

describe("safeEnqueue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries until enqueue succeeds", async () => {
    const enqueueSpy = vi.spyOn(queueModule, "enqueueJob")
      .mockImplementationOnce(() => {
        throw new Error("temporary failure");
      })
      .mockImplementationOnce(() => ({
        id: "job-1",
        type: "document_ocr",
        payload: { id: "doc-1" },
        createdAt: Date.now()
      }));

    await expect(
      safeEnqueue(
        { type: "document_ocr", payload: { id: "doc-1" } },
        { maxAttempts: 3, backoffMs: 0 }
      )
    ).resolves.toBe(true);

    expect(enqueueSpy).toHaveBeenCalledTimes(2);
  });

  it("throws after max attempts are exhausted", async () => {
    const enqueueSpy = vi.spyOn(queueModule, "enqueueJob").mockImplementation(() => {
      throw new Error("persistent failure");
    });

    await expect(
      safeEnqueue(
        { type: "document_ocr", payload: { id: "doc-1" } },
        { maxAttempts: 2, backoffMs: 0 }
      )
    ).rejects.toThrow("persistent failure");

    expect(enqueueSpy).toHaveBeenCalledTimes(2);
  });
});
