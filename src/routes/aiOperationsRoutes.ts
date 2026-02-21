import { Router } from "express";
import { forecastPipelineRevenue } from "../services/revenueForecasting";
import { autoOutboundHighValueLeads } from "../services/outbound/autoOutboundAgent";

const router = Router();

router.get("/maya/forecast", async (req, res) => {
  const forecast = await forecastPipelineRevenue();
  res.json(forecast);
});

router.post("/maya/run-outbound", async (req, res) => {
  await autoOutboundHighValueLeads();
  res.json({ status: "Outbound triggered" });
});

export default router;
