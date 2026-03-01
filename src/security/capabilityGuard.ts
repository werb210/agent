import { Capability, roleCapabilities } from "./capabilities";
import { MayaRole } from "./roles";
import { AppError } from "../errors/AppError";

export function requireCapability(role: MayaRole | string | undefined, capability: Capability | string) {
  const allowed = role ? roleCapabilities[role] || [] : [];
  if (!allowed.includes(capability as Capability)) {
    throw new AppError("unauthorized", 401, `Access denied: missing capability ${capability}`);
  }
}

