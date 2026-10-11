import { describe, it, expect, beforeEach } from "vitest";
import { getSessionHistory, appendSessionTurn, _clearAllSessions } from "../maya/sessionHistory.js";
describe("maya session history (v83)", () => {
  beforeEach(() => _clearAllSessions());
  it("empty for unknown session", () => { expect(getSessionHistory("nope")).toEqual([]); });
  it("remembers turn 1 on turn 2", () => {
    appendSessionTurn("s1", "Hi", "What's your name and an email or phone?");
    appendSessionTurn("s1", "Todd, 4035550123", "Thanks Todd!");
    const h = getSessionHistory("s1");
    expect(h.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
    expect(h.some((m) => m.content.includes("Todd, 4035550123"))).toBe(true);
  });
  it("isolates sessions", () => {
    appendSessionTurn("a", "I'm Alice", "Hi Alice");
    appendSessionTurn("b", "I'm Bob", "Hi Bob");
    expect(getSessionHistory("a").some((m) => m.content.includes("Alice"))).toBe(true);
    expect(getSessionHistory("a").some((m) => m.content.includes("Bob"))).toBe(false);
  });
  it("caps length at the last 20 entries (AGENT_v789_LIMITS)", () => {
    for (let i = 0; i < 30; i++) appendSessionTurn("c", `u${i}`, `a${i}`);
    expect(getSessionHistory("c").length).toBe(20);
    expect(getSessionHistory("c")[0].content).toBe("u20");
    expect(getSessionHistory("c").at(-1)?.content).toBe("a29");
  });
  it("ignores empty sessionId", () => { appendSessionTurn("", "x", "y"); expect(getSessionHistory("")).toEqual([]); });
});
