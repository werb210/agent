import { runMayaCore } from "../services/mayaCore";
import { runAI } from "../brain/openaiClient";

jest.mock("../brain/openaiClient", () => ({
  runAI: jest.fn()
}));

describe("runMayaCore", () => {
  it("injects stage into the system prompt", async () => {
    (runAI as jest.Mock).mockResolvedValue("Reply");

    await runMayaCore("hello", "qualifying", "client", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("Stage: qualifying"),
      "hello",
      [],
      undefined
    );
  });

  it("uses deterministic system prompt for client mode", async () => {
    (runAI as jest.Mock).mockResolvedValue("Reply");

    await runMayaCore("what products do you have", "new", "client", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("Do not speculate."),
      "what products do you have",
      [],
      undefined
    );
  });

  it("returns fallback when AI returns null", async () => {
    (runAI as jest.Mock).mockResolvedValue(null);

    const reply = await runMayaCore("hello", "new", "client", []);

    expect(reply).toBe("Insufficient data provided.");
  });

  it("uses staff system prompt in staff mode", async () => {
    (runAI as jest.Mock).mockResolvedValue("Reply");

    await runMayaCore("give me summary", "qualifying", "staff", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("Mode: staff"),
      "give me summary",
      [],
      undefined
    );
  });
});
