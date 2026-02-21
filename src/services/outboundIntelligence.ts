export interface OutboundLead {
  leadId: string;
  score: number;
  submittedAt: Date;
  callAttempts: number;
  lastAttemptAt?: Date | null;
}

const MAX_CALL_ATTEMPTS = 3;
const RETRY_WINDOW_HOURS = 24;
const FAST_FOLLOW_MINUTES = 5;

export function shouldRetryCall(callAttempts: number, lastAttemptAt?: Date | null): boolean {
  if (callAttempts >= MAX_CALL_ATTEMPTS) {
    return false;
  }

  if (!lastAttemptAt) {
    return true;
  }

  const elapsedHours = (Date.now() - lastAttemptAt.getTime()) / (1000 * 60 * 60);
  return elapsedHours >= RETRY_WINDOW_HOURS;
}

export function prioritizeOutboundLeads(leads: OutboundLead[]): OutboundLead[] {
  return [...leads].sort((a, b) => {
    const aFastFollow = isFastFollowWindow(a.submittedAt);
    const bFastFollow = isFastFollowWindow(b.submittedAt);

    if (aFastFollow !== bFastFollow) {
      return Number(bFastFollow) - Number(aFastFollow);
    }

    return b.score - a.score;
  });
}

function isFastFollowWindow(submittedAt: Date): boolean {
  const elapsedMinutes = (Date.now() - submittedAt.getTime()) / (1000 * 60);
  return elapsedMinutes <= FAST_FOLLOW_MINUTES;
}

export function buildAttemptEffectivenessLog(success: boolean, attemptNumber: number) {
  return {
    success,
    attemptNumber,
    effective: success && attemptNumber <= MAX_CALL_ATTEMPTS,
    loggedAt: new Date().toISOString()
  };
}


export function triggerOutboundCall(phone: string) {
  return {
    triggered: true,
    phone
  };
}
