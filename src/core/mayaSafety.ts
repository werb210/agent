import { ENV } from "../infrastructure/env";

export function enforceKillSwitch() {
  if (ENV.MAYA_GLOBAL_KILL_SWITCH === "true") {
    throw new Error("Maya global kill switch enabled");
  }
}
