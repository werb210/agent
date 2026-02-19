import { Router } from "express";
import { prisma } from "../config/db";

const router = Router();

router.post("/", async (req, res) => {
  const { Digits } = req.body;
  const { leadId } = req.query;

  if (Digits === "1") {
    await prisma.callOutcome.create({
      data: {
        leadId: leadId as string,
        outcome: "Booked",
        booked: true
      }
    });
  }

  const twiml = `
    <Response>
      <Say voice="alice">
        Thank you. Our team will reach out shortly.
      </Say>
    </Response>
  `;

  res.type("text/xml");
  res.send(twiml);
});

export default router;
