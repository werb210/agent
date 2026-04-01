import { runMayaCore } from "../services/mayaCore";
import * as openaiModule from "../brain/openaiClient";

jest.mock("../brain/openaiClient");

const mockedRunAI = openaiModule.runAI as jest.Mock;

describe("runMayaCore", () => {
  beforeEach(() => {
    mockedRunAI.mockClear();
  });

  it("injects stage into the system prompt", async () => {
    mockedRunAI.mockResolvedValue("Reply");

    await runMayaCore("hello", "qualifying", "client", []);

    expect(mockedRunAI).toHaveBeenCalledWith(
      expect.stringContaining("Stage: qualifying"),
      "hello",
      [],
      undefined
    );
  });

  it("uses deterministic system prompt for client mode", async () => {
    mockedRunAI.mockResolvedValue("Reply");

    await runMayaCore("what products do you have", "new", "client", []);

    expect(mockedRunAI).toHaveBeenCalledWith(
      expect.stringContaining("Do not speculate."),
      "what products do you have",
      [],
      undefined
    );
  });

  it("returns fallback when AI returns null", async () => {
    mockedRunAI.mockResolvedValue(null);

    const reply = await runMayaCore("hello", "new", "client", []);

    expect(reply).toBe("Insufficient data provided.");
  });

  it("uses staff system prompt in staff mode", async () => {
    mockedRunAI.mockResolvedValue("Reply");

    await runMayaCore("give me summary", "qualifying", "staff", []);

    expect(mockedRunAI).toHaveBeenCalledWith(
      expect.stringContaining("Mode: staff"),
      "give me summary",
      [],
      undefined
    );
  });
});
