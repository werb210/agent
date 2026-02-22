import { requireCapability } from "../security/capabilityGuard";
import { Capability } from "../security/capabilities";
import { MayaRole } from "../security/roles";
import { pool } from "./index";

export async function secureQuery(role: MayaRole | string | undefined, capability: Capability, query: string, params?: any[]) {
  requireCapability(role, capability);
  return pool.query(query, params);
}

