import { shouldEnqueue } from "../src/queue/jobDeduper.js";

describe("job dedupe", () => {
  it("suppresses duplicates in window", () => {
    expect(shouldEnqueue("document_ocr:doc-1")).toBe(true);
    expect(shouldEnqueue("document_ocr:doc-1")).toBe(false);
  });
});
