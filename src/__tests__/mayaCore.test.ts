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
      expect.stringContaining("Current stage: qualifying"),
      "hello",
      []
    );
  });

  it("returns fallback when AI returns null", async () => {
    (runAI as jest.Mock).mockResolvedValue(null);

    const reply = await runMayaCore("hello", "new", "client", []);

    expect(reply).toBe("Could you share a bit more detail?");
  });

  it("uses staff system prompt in staff mode", async () => {
    (runAI as jest.Mock).mockResolvedValue("Reply");

    await runMayaCore("give me summary", "qualifying", "staff", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("internal operations assistant"),
      "give me summary",
      []
    );
  });
});
