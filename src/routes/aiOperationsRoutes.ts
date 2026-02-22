import { Router } from "express";
import { forecastPipelineRevenue } from "../services/revenueForecasting";
import { autoOutboundHighValueLeads } from "../services/outbound/autoOutboundAgent";
import { requireApproval } from "../core/mayaApprovalGate";
import { pool } from "../db";
import { logMayaAction } from "../services/mayaActionLedger";
import { escalateIfAnomaly } from "../core/mayaEscalation";
import { capitalEfficiencyIndex } from "../core/capitalEfficiency";
import { calibrateProbability } from "../core/probabilityCalibration";

const router = Router();

router.get("/maya/forecast", async (req, res) => {
  const forecast = await forecastPipelineRevenue();
  res.json(forecast);
});

router.post("/maya/run-outbound", async (req, res) => {
  try {
    await requireApproval("mass_notification", req.body ?? {});
    await autoOutboundHighValueLeads();
    await logMayaAction("mass_notification", req.body ?? {}, "executed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outbound approval required";
    return res.status(202).json({ status: "awaiting_approval", message });
  }

  res.json({ status: "Outbound triggered" });
});

router.post("/maya/approve/:id", async (req: any, res) => {
  await pool.query(
    `UPDATE maya_action_approvals
     SET approved=true, approved_by=$1
     WHERE id=$2`,
    [req.user?.id ?? req.body?.approvedBy ?? null, req.params.id]
  );

  await logMayaAction("approval_granted", { approvalId: req.params.id }, "executed");
  res.json({ status: "approved" });
});

router.get("/maya/kpi", async (_req, res) => {
  const kpi = await pool.query(`SELECT * FROM maya_revenue_kpi`);
  const llmCost = await pool.query(`
    SELECT SUM(estimated_cost) AS total_llm_cost
    FROM maya_llm_usage
  `);

  const llmCostValue = Number(llmCost.rows[0]?.total_llm_cost || 0);
  escalateIfAnomaly(llmCostValue, Number(process.env.MAYA_LLM_COST_THRESHOLD || 250));

  const roiTotal = Number(kpi.rows[0]?.roi_score_total || 0);
  if (roiTotal < Number(process.env.MAYA_MIN_ROI_TOTAL || 0)) {
    throw new Error("Anomaly detected – escalation required");
  }

  await logMayaAction("kpi_read", { llmCost: llmCostValue }, "executed");
  res.json({
    kpi: kpi.rows[0],
    llm_cost: llmCost.rows[0].total_llm_cost || 0
  });
});

router.get("/maya/advanced-intel", async (_req, res) => {
  const efficiency = await capitalEfficiencyIndex();
  const calibrationError = await calibrateProbability();

  res.json({
    capital_efficiency_index: efficiency,
    prediction_error_rate: calibrationError
  });
});

export default router;
