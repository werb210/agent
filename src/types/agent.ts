export type Mode =
  | "WEBSITE_VISITOR"
  | "CLIENT_APPLICANT"
  | "PORTAL_STAFF"
  | "SERVER_INTERNAL"
  | "INTERNAL_TEST";

export type Task =
  | "chat"
  | "intake"
  | "memo"
  | "recommend"
  | "forecast"
  | "optimize";

export interface AgentRequest {
  requestId: string;
  timestamp: number;
  source: "website" | "client" | "portal" | "server";
  mode: Mode;
  task: Task;
  auth: {
    apiKey: string;
    signature: string;
  };
  session: {
    sessionId: string;
    userId?: string;
    role: "visitor" | "borrower" | "staff" | "admin";
  };
  data: {
    payload: any;
  };
}

export interface AgentResponse {
  requestId: string;
  status: "success" | "error";
  mode: Mode;
  task: Task;
  version: string;
  confidence?: number;
  result?: any;
  suggestedAction?: {
    type: string;
    confidence: number;
    data?: any;
  };
  warnings?: string[];
  metrics?: {
    latencyMs: number;
    tokensUsed?: number;
  };
}
