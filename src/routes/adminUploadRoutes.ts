import { Router } from "express";
import multer from "multer";
import { processExcel } from "../services/mayaOutbound/excelProcessor";
import { runOutboundCampaign } from "../services/mayaOutbound/outboundExecutor";

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

export default router;
