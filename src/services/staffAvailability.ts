// AGENT_BLOCK_v115_STAFF_AVAILABILITY_v1
// Previously this module imported a non-existent `pool` from the
// HTTP-only bfServerClient and queried staff_presence columns
// (staff_id, is_online, is_on_call) that do not exist. Real columns
// are (user_id, status, twilio_identity, last_heartbeat, updated_at).
// This rewrite calls BF-Server's existing GET /api/telephony/presence
// endpoint over HTTP, filters to status='available', and returns the
// list of user IDs + their twilio identity (used by some downstream
// callers to know if the staffer is on a webRTC seat).
import { callBFServer } from "../integrations/bfServerClient.js";

export type AvailableStaffMember = {
  userId: string;
  twilioIdentity: string | null;
};

type PresenceRow = {
  user_id: string;
  status: string;
  twilio_identity: string | null;
};

type PresenceResponse =
  | { data?: PresenceRow[] }
  | PresenceRow[]
  | null
  | undefined;

function normalizeRows(res: PresenceResponse): PresenceRow[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray((res as { data?: PresenceRow[] }).data)) {
    return (res as { data: PresenceRow[] }).data;
  }
  return [];
}

export async function getAvailableStaff(): Promise<AvailableStaffMember[]> {
  try {
    const res = await callBFServer<PresenceResponse>("/api/telephony/presence");
    const rows = normalizeRows(res);
    return rows
      .filter((r) => r.status === "available")
      .map((r) => ({
        userId: r.user_id,
        twilioIdentity: r.twilio_identity,
      }));
  } catch {
    // Network or auth failure → treat as nobody available so the
    // caller falls back to after-hours mode. Never throw upstream.
    return [];
  }
}
