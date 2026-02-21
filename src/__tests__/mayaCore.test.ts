import { runMayaCore } from "../services/mayaCore";
import { runAI } from "../brain/openaiClient";

jest.mock("../brain/openaiClient", () => ({
  runAI: jest.fn()
}));

describe("runMayaCore", () => {
  it("injects stage into the system prompt", async () => {
    (runAI as jest.Mock).mockResolvedValue("Reply");

    await runMayaCore("hello", "qualifying", []);

    expect(runAI).toHaveBeenCalledWith(
      expect.stringContaining("Current session stage: qualifying"),
      "hello",
      []
    );
  });

  it("returns fallback when AI returns null", async () => {
    (runAI as jest.Mock).mockResolvedValue(null);

    const reply = await runMayaCore("hello", "new", []);

    expect(reply).toBe("Could you share a bit more detail?");
  });
});
