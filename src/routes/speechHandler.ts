import { Router } from "express";
import { generateMayaResponse } from "../voice/mayaConversation";
import { prisma } from "../config/db";

const router = Router();

router.post("/", async (req, res) => {
  const speech = req.body.SpeechResult;

  const aiResult = await generateMayaResponse(speech);

  const escalate =
    aiResult.extractedRevenue &&
    aiResult.extractedRevenue > 1000000;

  await prisma.conversationLog.create({
    data: {
      transcript: speech,
      extractedRevenue: aiResult.extractedRevenue,
      extractedAmount: aiResult.extractedAmount,
      extractedIndustry: aiResult.extractedIndustry,
      urgencyLevel: aiResult.urgencyLevel,
      bookingIntent: aiResult.bookingIntent,
      escalated: !!escalate
    }
  });

  const twiml = `
    <Response>
      <Say voice="alice">
        ${aiResult.reply}
      </Say>
      <Gather input="speech" action="/speech-handler" method="POST" speechTimeout="auto"/>
    </Response>
  `;

  res.type("text/xml");
  res.send(twiml);
});

export default router;
