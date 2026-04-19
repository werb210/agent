import type { MayaRequest, MayaResponse } from "../../types/maya.js";
import { callBFServer } from "../../integrations/bfServerClient.js";

type ApplicationRecord = {
  id: string;
  company_name?: string;
  stage?: string;
  product_category?: string;
  requested_amount?: number;
  created_at?: string;
};

const STAGE_MESSAGES: Record<string, string> = {
  Received: "Our team has received your application and will begin review shortly.",
  "In Review": "Your application is currently being reviewed by our team.",
  "Documents Required": "We need additional documents from you. Please check your portal.",
  "Additional Steps Required": "There are additional steps required. Please log in to your portal for details.",
  "Off to Lender": "Your application has been submitted to lenders. You'll hear back soon.",
  Offer: "Great news — you have offers waiting! Log in to review and compare them.",
};

export async function handleClientMode(body: MayaRequest): Promise<MayaResponse> {
  if (!body.sessionId) {
    return {
      reply:
        "Hi! I'm your Boreal Financial assistant. To check your application status, I'll need your application ID. You can find it in your portal.",
      confidence: 0.5,
      escalated: false,
    };
  }

  try {
    const application = await callBFServer<ApplicationRecord>(
      `/api/applications/status?applicationId=${encodeURIComponent(body.sessionId)}`,
    );

    if (!application?.id) {
      return {
        reply: "I couldn't locate that application. Please check your portal or contact our team directly.",
        confidence: 0.3,
        escalated: false,
      };
    }

    const stage = application.stage ?? "Received";
    const stageMsg = STAGE_MESSAGES[stage] ?? "";
    const amount = application.requested_amount ? `$${application.requested_amount.toLocaleString()}` : "";
    const company = application.company_name ?? "your business";

    return {
      reply: `Your application for ${company}${amount ? ` (${amount})` : ""} is currently at the **${stage}** stage. ${stageMsg}`,
      confidence: 0.9,
      escalated: false,
    };
  } catch {
    return {
      reply:
        "I'm having trouble retrieving your application details right now. Please try again in a moment or contact our team.",
      confidence: 0.3,
      escalated: false,
    };
  }
}
