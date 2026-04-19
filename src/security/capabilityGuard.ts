import { Capability, roleCapabilities } from "./capabilities.js";
import { MayaRole } from "./roles.js";
import { AppError } from "../errors/AppError.js";

export function requireCapability(role: MayaRole | string | undefined, capability: Capability | string) {
  const allowed = role ? roleCapabilities[role] || [] : [];
  if (!allowed.includes(capability as Capability)) {
    throw new AppError("unauthorized", 401, `Access denied: missing capability ${capability}`);
  }
}

