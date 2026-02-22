import { validateStateTransition } from "../core/stateMachine";

describe("validateStateTransition", () => {
  it("allows valid transitions", () => {
    expect(() => validateStateTransition("new", "qualifying")).not.toThrow();
    expect(() => validateStateTransition("qualified", "submitted")).not.toThrow();
  });

  it("rejects invalid transitions", () => {
    expect(() => validateStateTransition("new", "funded")).toThrow(
      "Invalid state transition from new to funded"
    );
  });
});
