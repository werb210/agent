import { ENV } from "../infrastructure/env";
import { AppError } from "../errors/AppError";

export function enforceKillSwitch() {
  if (ENV.MAYA_GLOBAL_KILL_SWITCH === "true") {
    throw new AppError("internal_error", 500, "Maya global kill switch enabled");
  }
}
