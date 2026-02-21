import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/analytics/bookings", async (_req, res) => {
  const data = await pool.query(`
    SELECT
      broker_id,
      COUNT(*) as total_bookings,
      SUM(CASE WHEN show_up THEN 1 ELSE 0 END) as show_rate,
      SUM(CASE WHEN closed THEN 1 ELSE 0 END) as closes,
      SUM(revenue) as total_revenue
    FROM maya_booking_analytics
    GROUP BY broker_id
  `);

  res.json(data.rows);
});

export default router;
