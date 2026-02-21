import { Router } from "express";
import { multiTouchAttribution } from "../services/multiTouchAttribution";
import { recommendAssignment } from "../services/staffLoadBalancer";

const router = Router();

router.get("/maya/multi-touch/:leadId", async (req, res) => {
  const data = await multiTouchAttribution(req.params.leadId);
  res.json(data);
});

router.get("/maya/recommend-assignment", async (req, res) => {
  const staff = await recommendAssignment();
  res.json({ recommendedStaff: staff });
});

export default router;
