import type { MayaRequest, MayaResponse } from "../../types/maya";
import { callBFServer } from "../../integrations/bfServerClient";

type DealRecord = {
  id: string;
  company_name?: string;
  stage?: string;
  product_category?: string;
  requested_amount?: number;
  created_at?: string;
  assigned_to?: string;
  documents_accepted?: number;
  documents_total?: number;
};

export async function handleStaffMode(body: MayaRequest): Promise<MayaResponse> {
  if (!body.contextId) {
    try {
      const pipeline = await callBFServer<DealRecord[]>("/api/staff/pipeline");
      const count = Array.isArray(pipeline) ? pipeline.length : 0;
      return {
        reply: `You have ${count} active application${count !== 1 ? "s" : ""} in the pipeline. Which deal would you like to know about?`,
        confidence: 0.7,
        escalated: false,
      };
    } catch {
      return {
        reply: "Please provide a deal ID and I can give you a summary of that application.",
        confidence: 0.4,
        escalated: false,
      };
    }
  }

  try {
    const deal = await callBFServer<DealRecord>(
      `/api/applications/status?applicationId=${encodeURIComponent(body.contextId)}`,
    );

    if (!deal?.id) {
      return { reply: "Deal not found.", confidence: 0.3, escalated: false };
    }

    const amount = deal.requested_amount ? `$${deal.requested_amount.toLocaleString()}` : "Amount TBD";
    const docs =
      deal.documents_total != null
        ? ` Documents: ${deal.documents_accepted ?? 0}/${deal.documents_total} accepted.`
        : "";

    return {
      reply: `**${deal.company_name ?? "Unknown"}** — ${amount} ${deal.product_category ?? ""}. Stage: **${deal.stage ?? "Received"}**.${docs} Submitted: ${deal.created_at ? new Date(deal.created_at).toLocaleDateString() : "N/A"}.`,
      confidence: 0.9,
      escalated: false,
    };
  } catch {
    return {
      reply: "Unable to retrieve deal details right now.",
      confidence: 0.3,
      escalated: false,
    };
  }
}
