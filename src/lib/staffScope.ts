// AGENT_v789_STAFF_SCOPE - silo and role for every staff tool come from the verified
// X-Maya-Context, never from the model. dispatchTool runs each staff tool inside this
// scope and callBFServer stamps silo and role onto every /api/maya/ request body made
// within it, overriding anything the model put there. One place, so a new staff tool
// cannot forget it.
import { AsyncLocalStorage } from "node:async_hooks";

// AGENT_v868_ACTING_STAFF - and the acting staff member: callBFServer sends their id (staff_user_id) on every staff
// call, plus the X-Maya-Context token BF-Server signed for this request, so BF-Server can check that id (and the
// silo) against its own signature and refuse a call that names anyone else.
export type StaffScope = { silo: string; role: string | null; staffUserId?: string | null; context?: string | null };

const als = new AsyncLocalStorage<StaffScope>();

export function runInStaffScope<T>(scope: StaffScope, fn: () => Promise<T>): Promise<T> {
  return als.run(scope, fn);
}

export function currentStaffScope(): StaffScope | undefined {
  return als.getStore();
}
