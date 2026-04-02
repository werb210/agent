export type MayaEvent =
  | { type: "call.started"; callId: string }
  | { type: "call.ended"; callId: string }
  | { type: "lead.created"; id: string }
  | { type: "message.received"; text: string }
  | { type: "tool.executed"; name: string };
