import { NextFunction, Request, Response } from "express";
import twilio from "twilio";

function buildTwilioValidationUrl(req: Request) {
  const base = process.env.PUBLIC_WEBHOOK_URL;
  if (!base) {
    return "";
  }

  return `${base}${req.originalUrl}`;
}

export function verifyTwilioSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers["x-twilio-signature"] as string | undefined;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const url = buildTwilioValidationUrl(req);

  if (!signature || !authToken || !url) {
    return res.status(403).json({ error: "invalid_twilio_signature" });
  }

  const expected = twilio.validateRequest(authToken, signature, url, req.body as Record<string, unknown>);

  if (!expected) {
    return res.status(403).json({ error: "invalid_twilio_signature" });
  }

  return next();
}
