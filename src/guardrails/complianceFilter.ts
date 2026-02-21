export interface GuardrailResult {
  safeReply: string;
  escalated: boolean;
  violationDetected: boolean;
}

const forbiddenPatterns = [
  /you will be approved/i,
  /you won'?t be approved/i,
  /guaranteed approval/i,
  /underwriting score/i,
  /internal scoring/i,
  /lender decision logic/i,
  /you should/i,
  /I recommend you/i,
  /negotiate/i
];

export function complianceFilter(reply: string): GuardrailResult {
  let violation = false;

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(reply)) {
      violation = true;
      break;
    }
  }

  if (!violation) {
    return {
      safeReply: reply,
      escalated: false,
      violationDetected: false
    };
  }

  return {
    safeReply:
      "I can’t provide approval predictions or financial advice. A funding specialist can review your file and discuss options with you.",
    escalated: true,
    violationDetected: true
  };
}
