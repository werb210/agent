import { determineNextStage } from "../services/qualificationEngine";

describe("determineNextStage", () => {
  it("moves new sessions into qualifying on first message", () => {
    expect(determineNextStage("new", "Hi Maya")).toBe("qualifying");
  });

  it("moves qualifying sessions into collecting_docs when qualification fields are discussed", () => {
    expect(determineNextStage("qualifying", "Our monthly sales are 150k")).toBe("collecting_docs");
  });

  it("moves collecting_docs sessions into booking when booking intent appears", () => {
    expect(determineNextStage("collecting_docs", "Can we schedule a call?")).toBe("booking");
  });

  it("keeps stage unchanged when no trigger phrase is present", () => {
    expect(determineNextStage("qualifying", "Tell me more about your process")).toBe("qualifying");
  });
});
