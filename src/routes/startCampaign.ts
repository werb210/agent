import { Router } from "express";
import { prisma } from "../config/db";
import { twilioClient, fromNumber } from "../config/twilio";

const router = Router();

router.post("/", async (req, res) => {
  const leads = await (prisma as any).callQueue.findMany({
    where: { status: "pending" },
    orderBy: { priority: "desc" },
    take: 5
  });

  for (const item of leads) {
    const analysis = await prisma.leadAnalysis.findUnique({
      where: { id: item.leadId }
    });

    if (!analysis) continue;

    await twilioClient.calls.create({
      url: `${process.env.PUBLIC_AGENT_URL}/voice-handler?leadId=${item.leadId}`,
      to: req.body.phoneNumber,
      from: fromNumber
    });

    await (prisma as any).callQueue.update({
      where: { id: item.id },
      data: { status: "dialed" }
    });
  }

  res.json({ status: "Campaign started" });
});

export default router;
