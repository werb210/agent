export type MayaMode = "client" | "staff" | "marketing";

export interface MayaRequest {
  mode: MayaMode;
  sessionId: string;
  message: string;
  contextId?: string; // dealId, clientId, etc.
}

export interface MayaResponse {
  reply: string;
  confidence: number;
  escalated: boolean;
  actions?: string[];
}
