import { runMayaCore } from "../services/mayaCore";

jest.mock("../brain/openaiClient");

describe("runMayaCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("injects stage into the system prompt", async () => {
    const { runAI } = require("../brain/openaiClient");
    runAI.mockResolvedValue("Reply");

    await runMayaCore("hello", "qualifying", "client", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("Stage: qualifying"),
      "hello",
      [],
      undefined
    );
  });

  it("uses deterministic system prompt for client mode", async () => {
    const { runAI } = require("../brain/openaiClient");
    runAI.mockResolvedValue("Reply");

    await runMayaCore("what products do you have", "new", "client", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("Do not speculate."),
      "what products do you have",
      [],
      undefined
    );
  });

  it("returns fallback when AI returns null", async () => {
    const { runAI } = require("../brain/openaiClient");
    runAI.mockResolvedValue(null);

    const reply = await runMayaCore("hello", "new", "client", []);

    expect(reply).toBe("Insufficient data provided.");
  });

  it("uses staff system prompt in staff mode", async () => {
    const { runAI } = require("../brain/openaiClient");
    runAI.mockResolvedValue("Reply");

    await runMayaCore("give me summary", "qualifying", "staff", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("Mode: staff"),
      "give me summary",
      [],
      undefined
    );
  });
});
