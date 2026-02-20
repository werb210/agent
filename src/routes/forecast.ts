import { Router } from "express";
import { forecastMonthlyRevenue } from "../brain/revenueForecast";

const router = Router();

router.get("/", async (_, res) => {
  const forecast = await forecastMonthlyRevenue();

  return res.json(forecast);
});

export default router;
