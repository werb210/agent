export type MayaActionType =
  | "none"
  | "book"
  | "transfer"
  | "follow_up"
  | "qualify"
  | "staff_pipeline_summary"
  | "staff_applications_by_status";

export interface MayaAction {
  type: MayaActionType;
  requiresConfirmation: boolean;
  payload?: any;
}
