import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export interface CampaignMetrics {
  source: string;
  leads: number;
  bookings: number;
  funded: number;
  currentBudget: number;
}

export interface MarketingExecutionSettings {
  autonomy_level: number;
  allow_full_auto_marketing: boolean;
  max_daily_budget_shift_percent: number;
  min_data_points_before_adjustment: number;
}

export interface CampaignAdjustmentResult {
  adjust: boolean;
  newBudget?: number;
  reason?: string;
  adjustmentPercent?: number;
}

function blockExecution(reason: string): never {
  throw new Error(`Marketing execution blocked: ${reason}`);
}

export function evaluateCampaignAdjustment(
  campaign: CampaignMetrics,
  settings: MarketingExecutionSettings
): CampaignAdjustmentResult {
  if (!settings.allow_full_auto_marketing) {
    return { adjust: false };
  }

  if (campaign.leads < settings.min_data_points_before_adjustment) {
    return { adjust: false };
  }

  const bookingRate = campaign.bookings / campaign.leads;

  if (bookingRate < 0.1) {
    return {
      adjust: true,
      newBudget:
        campaign.currentBudget *
        (1 - settings.max_daily_budget_shift_percent / 100),
      reason: "Underperforming booking rate",
      adjustmentPercent: settings.max_daily_budget_shift_percent
    };
  }

  if (bookingRate > 0.3) {
    return {
      adjust: true,
      newBudget:
        campaign.currentBudget *
        (1 + settings.max_daily_budget_shift_percent / 100),
      reason: "High ROI booking rate",
      adjustmentPercent: settings.max_daily_budget_shift_percent
    };
  }

  return { adjust: false };
}

export async function executeCampaignAdjustment(
  campaign: CampaignMetrics,
  settings: MarketingExecutionSettings
) {
  if (settings.autonomy_level < 5) {
    return { executed: false, reason: "Autonomy level below 5" };
  }

  const adjustment = evaluateCampaignAdjustment(campaign, settings);

  if (!adjustment.adjust || adjustment.newBudget === undefined) {
    return { executed: false, reason: "No adjustment required" };
  }

  const adjustmentPercent = Math.abs(
    ((adjustment.newBudget - campaign.currentBudget) / campaign.currentBudget) * 100
  );

  if (adjustmentPercent > settings.max_daily_budget_shift_percent) {
    blockExecution("Adjustment exceeds max_daily_budget_shift_percent");
  }

  await pool.query(
    `INSERT INTO maya_marketing_actions
      (source, previous_budget, new_budget, reason)
     VALUES ($1, $2, $3, $4)`,
    [
      campaign.source,
      campaign.currentBudget,
      adjustment.newBudget,
      adjustment.reason ?? "Budget adjustment"
    ]
  );

  await pool.query(
    `INSERT INTO maya_decisions (session_id, decision_type, confidence, outcome)
     VALUES ($1, $2, $3, $4)`,
    [
      campaign.source,
      "marketing_budget_adjustment",
      0.95,
      `Budget changed from ${campaign.currentBudget} to ${adjustment.newBudget}`
    ]
  );

  return {
    executed: true,
    source: campaign.source,
    previousBudget: campaign.currentBudget,
    newBudget: adjustment.newBudget,
    reversible: true,
    timestamp: new Date().toISOString(),
    reason: adjustment.reason
  };
}

export async function reverseCampaignAdjustment(actionId: number) {
  const actionResult = await pool.query(
    `SELECT id, source, previous_budget, new_budget, reason
     FROM maya_marketing_actions
     WHERE id = $1`,
    [actionId]
  );

  if (!actionResult.rows.length) {
    return { reversed: false, reason: "Action not found" };
  }

  const action = actionResult.rows[0];

  await pool.query(
    `INSERT INTO maya_marketing_actions
      (source, previous_budget, new_budget, reason)
     VALUES ($1, $2, $3, $4)`,
    [
      action.source,
      action.new_budget,
      action.previous_budget,
      `Reversal of action ${action.id}: ${action.reason}`
    ]
  );

  await pool.query(
    `INSERT INTO maya_decisions (session_id, decision_type, confidence, outcome)
     VALUES ($1, $2, $3, $4)`,
    [
      action.source,
      "marketing_budget_reversal",
      0.99,
      `Budget reversed from ${action.new_budget} to ${action.previous_budget}`
    ]
  );

  return {
    reversed: true,
    source: action.source,
    restoredBudget: action.previous_budget,
    timestamp: new Date().toISOString()
  };
}
