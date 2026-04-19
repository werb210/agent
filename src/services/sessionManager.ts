import { AppError } from "../errors/AppError.js";
const activeSessions = new Map<string, number>();

export function startSession(identity: string) {
  if (activeSessions.has(identity)) {
    throw new AppError("bad_request", 400, "session_already_active");
  }

  activeSessions.set(identity, Date.now());
}

export function endSession(identity: string) {
  activeSessions.delete(identity);
}

export function hasSession(identity: string) {
  return activeSessions.has(identity);
}
