// AGENT_v789_SESSION_KEY [162] - a session id alone never loads another person's history or
// resolved application: stores are keyed by audience + verified subject + session id.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sessionKey } from "../sessionKey.js";
import { verifyMayaContext } from "../context.js";
import { _clearAllSessions } from "../sessionHistory.js";
import { dispatchTool, getResolvedApplicationId } from "../dispatch.js";
import { createBfServerFake } from "../../../test/bfServerFake.js";
import { mayaContext } from "../../../test/mayaContext.js";
import { ask, startMayaRouter, type Started } from "../../../test/mayaHarness.js";
import { APP_ID } from "../../../test/fixtures/bfServer.v789.js";

process.env.JWT_SECRET = "session-scope-secret";
process.env.OPENAI_API_KEY = "test-key";
const realFetch = globalThis.fetch;
let maya: Started;
beforeAll(async () => { maya = await startMayaRouter(); });
afterAll(async () => { globalThis.fetch = realFetch; await maya.close(); });
beforeEach(() => _clearAllSessions());

const historyOf = (bodies: any[]) => JSON.stringify(bodies[0].messages.filter((m: any) => m.role === "user" || m.role === "assistant"));

describe("session keys", () => {
  it("differ by audience, subject and session id", () => {
    const keys = new Set([
      sessionKey("client", "+17805550111", "s1"),
      sessionKey("client", "+17805550199", "s1"),
      sessionKey("visitor", "+17805550111", "s1"),
      sessionKey("client", "+17805550111", "s2"),
    ]);
    expect(keys.size).toBe(4);
    expect(sessionKey("client", "x", "")).toBe("");
  });

  it("take the subject from the verified context", () => {
    expect(verifyMayaContext(mayaContext({ audience: "client", phone: "+17805550111" })).subject).toBe("+17805550111");
    expect(verifyMayaContext(mayaContext({ audience: "staff", staff: { id: "u-1" } })).subject).toBe("u-1");
    expect(verifyMayaContext(mayaContext({ audience: "visitor", sub: "v-9" })).subject).toBe("v-9");
  });
});

describe("history", () => {
  it("another client with the same session id cannot load it", async () => {
    await ask(maya.base, { message: "my SIN is 123", session_id: "shared" }, { audience: "client", phone: "+17805550111" }, [{ role: "assistant", content: "noted" }]);
    const own = await ask(maya.base, { message: "again", session_id: "shared" }, { audience: "client", phone: "+17805550111" }, [{ role: "assistant", content: "ok" }]);
    expect(historyOf(own.openai)).toContain("my SIN is 123");
    const other = await ask(maya.base, { message: "what did I say?", session_id: "shared" }, { audience: "client", phone: "+17805550199" }, [{ role: "assistant", content: "?" }]);
    expect(historyOf(other.openai)).not.toContain("my SIN is 123");
    const visitor = await ask(maya.base, { message: "what did I say?", session_id: "shared" }, { audience: "visitor", sub: "v-1" }, [{ role: "assistant", content: "?" }]);
    expect(historyOf(visitor.openai)).not.toContain("my SIN is 123");
  });

  it("a visitor cannot read another visitor's session by its id", async () => {
    await ask(maya.base, { message: "I'm Dana, 780-555-0111", session_id: "v-sess" }, { audience: "visitor", sub: "v-1" }, [{ role: "assistant", content: "hi Dana" }]);
    const other = await ask(maya.base, { message: "hi", session_id: "v-sess" }, { audience: "visitor", sub: "v-2" }, [{ role: "assistant", content: "hi" }]);
    expect(historyOf(other.openai)).not.toContain("780-555-0111");
  });
});

describe("resolved application cache", () => {
  it("is not shared between clients that reuse a session id", async () => {
    globalThis.fetch = createBfServerFake().fetch;
    await dispatchTool("application.find_mine", {}, { audience: "client", phone: "+17805550111", subject: "+17805550111", sessionId: "same" });
    expect(getResolvedApplicationId(sessionKey("client", "+17805550111", "same"))).toBe(APP_ID);
    expect(getResolvedApplicationId(sessionKey("client", "+17805550199", "same"))).toBeNull();
    expect(getResolvedApplicationId("same")).toBeNull();
    const fake = createBfServerFake();
    globalThis.fetch = fake.fetch;
    const out = JSON.parse(await dispatchTool("application.my_status", {}, { audience: "client", phone: "+17805550199", subject: "+17805550199", sessionId: "same" }));
    expect(out.ok).toBe(false);
    expect(fake.calls.some((c) => c.path === "/api/maya/staff/application-summary")).toBe(false);
  });
});
