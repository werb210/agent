export type MayaMode = "client" | "staff" | "marketing";

export interface MayaRequest {
  mode?: MayaMode;
  sessionId: string;
  message?: string;
  action?: "book";
  startISO?: string;
  endISO?: string;
  phone?: string;
  contextId?: string; // dealId, clientId, etc.
  confirmed?: boolean;
  lookupIdentifier?: string;
  productType?: string;
  status?: string;
}

export interface MayaResponse {
  reply: string;
  confidence: number;
  escalated: boolean;
  actions?: string[];
}
