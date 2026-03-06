import { shouldEnqueue, clearRecentJobs } from "../src/queue/jobDeduper";

describe("job dedupe", () => {
  beforeEach(() => {
    clearRecentJobs();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("suppresses duplicates in window", () => {
    expect(shouldEnqueue("document_ocr", "doc-1")).toBe(true);
    expect(shouldEnqueue("document_ocr", "doc-1")).toBe(false);

    jest.advanceTimersByTime(30001);
    expect(shouldEnqueue("document_ocr", "doc-1")).toBe(true);
  });
});
