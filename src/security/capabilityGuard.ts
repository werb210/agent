import { Capability, roleCapabilities } from "./capabilities";
import { MayaRole } from "./roles";

export function requireCapability(role: MayaRole | string | undefined, capability: Capability | string) {
  const allowed = role ? roleCapabilities[role] || [] : [];
  if (!allowed.includes(capability as Capability)) {
    throw new Error(`Access denied: missing capability ${capability}`);
  }
}

