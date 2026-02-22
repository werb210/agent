const allowedTransitions: Record<string, string[]> = {
  new: ["qualifying"],
  qualifying: ["qualified", "archived"],
  qualified: ["booked", "submitted", "archived"],
  booked: ["submitted", "archived"],
  submitted: ["funded", "declined", "archived"],
  funded: ["archived"],
  declined: ["archived"],
  archived: []
};

export function validateStateTransition(current: string, next: string) {
  if (!allowedTransitions[current]?.includes(next)) {
    throw new Error(`Invalid state transition from ${current} to ${next}`);
  }
}
