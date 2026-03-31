import express from "express";
import request from "supertest";
import mayaRouter from "../src/routes/maya";
import { generateMayaResponse } from "../src/ai";
import { resetMayaChatRateLimiter } from "../src/middleware/rateLimit";

jest.mock("../src/ai", () => ({
  generateMayaResponse: jest.fn(),
}));

const mockedGenerateMayaResponse = generateMayaResponse as jest.MockedFunction<typeof generateMayaResponse>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/maya", mayaRouter);
  return app;
}

describe("maya route production hardening", () => {
  beforeEach(() => {
    mockedGenerateMayaResponse.mockReset();
    process.env.MAYA_API_KEY = "test-api-key";
    resetMayaChatRateLimiter();
  });

  it("rejects invalid payload", async () => {
    const app = buildApp();

    const response = await request(app)
      .post("/maya/chat")
      .set("x-api-key", "test-api-key")
      .send({ message: 123 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "invalid_input" });
  });

  it("handles ai timeout", async () => {
    const app = buildApp();
    mockedGenerateMayaResponse.mockResolvedValueOnce({ success: false, message: "ai_timeout" });

    const response = await request(app)
      .post("/maya/chat")
      .set("x-api-key", "test-api-key")
      .send({ message: "hello" });

    expect(response.status).toBe(504);
    expect(response.body).toEqual({ success: false, message: "ai_timeout" });
  });

  it("rate limits spam requests", async () => {
    const app = buildApp();
    mockedGenerateMayaResponse.mockResolvedValue({ success: true, reply: "ok" });

    let lastResponse;
    for (let i = 0; i < 21; i += 1) {
      lastResponse = await request(app)
        .post("/maya/chat")
        .set("x-api-key", "test-api-key")
        .send({ message: `hello ${i}` });
    }

    expect(lastResponse?.status).toBe(429);
    expect(lastResponse?.body).toEqual({ success: false, message: "rate_limited" });
  });

  it("rejects unauthenticated requests", async () => {
    const app = buildApp();

    const response = await request(app).post("/maya/chat").send({ message: "hello" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, message: "unauthenticated" });
  });

  it("returns success for normal request", async () => {
    const app = buildApp();
    mockedGenerateMayaResponse.mockResolvedValueOnce({ success: true, reply: "hi" });

    const response = await request(app)
      .post("/maya/chat")
      .set("x-api-key", "test-api-key")
      .send({ message: "hello" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { reply: "hi" } });
  });
});
