import axios from "axios";
import { Router } from "express";
import { prisma } from "../config/db";
import { generateMayaResponse } from "../voice/mayaConversation";
import { getSession, updateSession } from "../voice/sessionStore";

const router = Router();

router.post("/", async (req, res) => {
  const speech = req.body.SpeechResult;
  const callSid = req.body.CallSid;

  const aiResult = await generateMayaResponse(speech);

  updateSession(callSid, {
    revenue: aiResult.extractedRevenue || undefined,
    amount: aiResult.extractedAmount || undefined,
    industry: aiResult.extractedIndustry || undefined,
    urgency: aiResult.urgencyLevel || undefined
  });

  const session = getSession(callSid);

  const highValue = session.revenue && session.revenue > 1000000;
  const bookingIntent = aiResult.bookingIntent;

  await prisma.conversationLog.create({
    data: {
      transcript: speech,
      extractedRevenue: aiResult.extractedRevenue,
      extractedAmount: aiResult.extractedAmount,
      extractedIndustry: aiResult.extractedIndustry,
      urgencyLevel: aiResult.urgencyLevel,
      bookingIntent: aiResult.bookingIntent,
      escalated: !!highValue
    }
  });

  if (highValue) {
    await axios.post(process.env.SERVER_ESCALATION_WEBHOOK!, {
      revenue: session.revenue,
      industry: session.industry,
      urgency: session.urgency
    });

    const twiml = `
      <Response>
        <Say voice="alice">
          This looks like a high priority file. I’m connecting you to our funding team now.
        </Say>
        <Dial>${process.env.STAFF_TRANSFER_NUMBER}</Dial>
      </Response>
    `;

    res.type("text/xml");
    return res.send(twiml);
  }

  if (bookingIntent) {
    await axios.post(process.env.BOOKING_WEBHOOK!, {
      revenue: session.revenue,
      amount: session.amount,
      industry: session.industry,
      urgency: session.urgency
    });

    const twiml = `
      <Response>
        <Say voice="alice">
          Perfect. I’ve scheduled a funding review call. Our team will contact you shortly.
        </Say>
      </Response>
    `;

    res.type("text/xml");
    return res.send(twiml);
  }

  const twiml = `
    <Response>
      <Say voice="alice">
        ${aiResult.reply}
      </Say>
      <Gather input="speech" action="/speech-handler" method="POST" speechTimeout="auto"/>
    </Response>
  `;

  res.type("text/xml");
  return res.send(twiml);
});

export default router;
