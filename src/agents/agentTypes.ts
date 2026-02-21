export interface MayaAgentPayload {
  funding_amount: number;
  product_type?: string;
  industry?: string;
  time_in_business?: number;
}

export interface SalesAgentResult {
  likelihood: number;
  recommended_action: "priority_followup" | "standard_followup";
}

export interface MarketingAgentResult {
  projected_roi: number;
  suggested_budget: number;
}

export interface RiskAgentResult {
  risk_score: number;
  risk_level: "high" | "moderate";
}
