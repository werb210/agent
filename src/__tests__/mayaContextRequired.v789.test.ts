// AGENT_v789_MAYA_CONTEXT_REQUIRED [160] - every /api/maya/* route needs a valid BF-Server-signed
// X-Maya-Context; a direct call without one gets 401 and never reaches OpenAI or BF-Server.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { listen, post, type Started } from "../../test/mayaHarness.js";
import { createBfServerFake, openaiScript } from "../../test/bfServerFake.js";
import { mayaContext } from "../../test/mayaContext.js";
import { signServiceToken } from "../lib/serviceToken.js";

const SECRET = "context-required-secret";
const realFetch = globalThis.fetch;
let app: Started;
let openai: ReturnType<typeof openaiScript>;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  process.env.OPENAI_API_KEY = "test-key";
  openai = openaiScript([{ role: "assistant", content: "hello" }]);
  globalThis.fetch = createBfServerFake({ openai }).fetch;
  app = await listen(createApp().app);
});
afterAll(async () => { globalThis.fetch = realFetch; await app.close(); });

const ORIGIN = { Origin: "https://boreal.financial" };

describe("/api/maya/* requires X-Maya-Context", () => {
  it("401s a direct call with no context, even from an allowed origin or with a service token", async () => {
    for (const path of ["/api/maya/message", "/api/maya/chat"]) {
      expect((await post(app.base, path, { message: "hi" }, ORIGIN)).status, path).toBe(401);
      expect((await post(app.base, path, { message: "hi" }, { Authorization: "Bearer " + signServiceToken() })).status, path).toBe(401);
      expect((await post(app.base, path, { message: "hi" }, { Authorization: "Bearer " + jwt.sign({ kind: "service" }, SECRET) })).status, path).toBe(401);
    }
    expect(openai.bodies.length).toBe(0);
  });

  it("401s a forged, expired or wrong-kind context", async () => {
    const forged = mayaContext({ audience: "staff", staff: { id: "x" } }, "wrong-secret");
    const expired = jwt.sign({ kind: "maya_context", audience: "visitor", exp: Math.floor(Date.now() / 1000) - 10 }, SECRET);
    const wrongKind = jwt.sign({ kind: "service", audience: "visitor" }, SECRET);
    for (const ctx of [forged, expired, wrongKind, "not-a-jwt"]) {
      const r = await post(app.base, "/api/maya/message", { message: "hi" }, { ...ORIGIN, "x-maya-context": ctx });
      expect(r.status).toBe(401);
      expect(r.body.error).toBe("maya_context_required");
    }
    expect(openai.bodies.length).toBe(0);
  });

  it("accepts a valid context for every audience", async () => {
    for (const claims of [{ audience: "visitor", sub: "v" }, { audience: "client", phone: "+17805550111" }, { audience: "staff", staff: { id: "u-1", role: "Staff" } }]) {
      const r = await post(app.base, "/api/maya/message", { message: "hi" }, { "x-maya-context": mayaContext(claims, SECRET) });
      expect(r.status, claims.audience).toBe(200);
      expect(r.body.audience).toBe(claims.audience);
    }
  });
});
