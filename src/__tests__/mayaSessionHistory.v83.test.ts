import { describe, it, expect, beforeEach } from "vitest";
import { getSessionHistory, appendSessionTurn, _clearAllSessions } from "../maya/sessionHistory.js";
describe("maya session history (v83)", () => {
  beforeEach(() => _clearAllSessions());
  it("empty for unknown session", () => { expect(getSessionHistory("nope")).toEqual([]); });
  it("remembers turn 1 on turn 2", () => {
    appendSessionTurn("s1", "Hi", "What's your name and an email or phone?");
    appendSessionTurn("s1", "Todd, 5878881837", "Thanks Todd!");
    const h = getSessionHistory("s1");
    expect(h.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
    expect(h.some((m) => m.content.includes("Todd, 5878881837"))).toBe(true);
  });
  it("isolates sessions", () => {
    appendSessionTurn("a", "I'm Alice", "Hi Alice");
    appendSessionTurn("b", "I'm Bob", "Hi Bob");
    expect(getSessionHistory("a").some((m) => m.content.includes("Alice"))).toBe(true);
    expect(getSessionHistory("a").some((m) => m.content.includes("Bob"))).toBe(false);
  });
  it("caps length", () => {
    for (let i = 0; i < 20; i++) appendSessionTurn("c", `u${i}`, `a${i}`);
    expect(getSessionHistory("c").length).toBeLessThanOrEqual(12);
    expect(getSessionHistory("c").some((m) => m.content === "a19")).toBe(true);
  });
  it("ignores empty sessionId", () => { appendSessionTurn("", "x", "y"); expect(getSessionHistory("")).toEqual([]); });
});
