export type MayaActionType =
  | "none"
  | "book"
  | "transfer"
  | "follow_up"
  | "qualify";

export interface MayaAction {
  type: MayaActionType;
  requiresConfirmation: boolean;
  payload?: any;
}
