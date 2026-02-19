export interface LeadInput {
  requestedAmount: number;
  industry: string;
  creditScore?: number;
  underwritingReadiness?: "ready" | "partial" | "low";
}
