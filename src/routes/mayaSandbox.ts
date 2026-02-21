import { Router } from "express";
import { resilientLLM } from "../infrastructure/mayaResilience";

const router = Router();

router.post("/maya/sandbox", async (req, res) => {
  const { message } = req.body;

  const result = await resilientLLM("strategy", String(message ?? ""));

  res.json({
    simulated: true,
    output: result.output,
    model: result.model
  });
});

export default router;
