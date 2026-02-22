import { Router } from "express";
import multer from "multer";
import { processExcel } from "../services/mayaOutbound/excelProcessor";
import { runOutboundCampaign } from "../services/mayaOutbound/outboundExecutor";
import { createCorrelationId, logAudit } from "../core/auditLogger";
import { requireCapability } from "../security/capabilityGuard";
import { secureQuery } from "../db/secureDb";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-leads", upload.single("file"), async (req: any, res) => {

  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { campaignName } = req.body;

  const result = await processExcel(req.file.path, campaignName || "Manual Upload");

  res.json(result);
});

router.post("/run-outbound/:campaignId", async (req: any, res) => {

  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  const count = await runOutboundCampaign(req.params.campaignId);

  res.json({ callsTriggered: count });
});

router.patch("/session/:sessionId/override", async (req: any, res) => {
  const role = String(req.user?.role ?? req.headers?.["x-maya-role"] ?? "").toLowerCase();
  requireCapability(role, "admin_override");

  const { sessionId } = req.params;
  const { updates } = req.body as { updates?: Record<string, unknown> };

  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "updates payload is required" });
  }

  const existingResult = await secureQuery(
    role,
    "view_sessions",
    `SELECT data FROM sessions WHERE session_id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!existingResult.rows.length) {
    return res.status(404).json({ error: "Session not found" });
  }

  const oldValues = existingResult.rows[0].data || {};
  const newValues = {
    ...oldValues,
    ...updates
  };

  await secureQuery(
    role,
    "modify_sessions",
    `UPDATE sessions SET data = $1 WHERE session_id = $2`,
    [newValues, sessionId]
  );

  await logAudit({
    correlationId: createCorrelationId(),
    agentName: "Admin",
    actionType: "manual_override",
    entityType: "session",
    entityId: sessionId,
    previousValue: oldValues,
    newValue: newValues
  });

  return res.json({ success: true, sessionId, data: newValues });
});

export default router;
