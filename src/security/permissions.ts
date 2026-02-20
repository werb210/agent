import { Mode, Task } from "../types/agent";

const permissionMatrix: Record<Mode, Task[]> = {
  WEBSITE_VISITOR: ["chat"],
  CLIENT_APPLICANT: ["chat", "intake"],
  PORTAL_STAFF: ["memo", "recommend", "optimize"],
  SERVER_INTERNAL: ["forecast", "optimize"]
};

export function validatePermissions(mode: Mode, task: Task) {
  if (!permissionMatrix[mode].includes(task)) {
    throw new Error("Forbidden task for mode");
  }
}
