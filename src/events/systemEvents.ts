import crypto from "crypto";
import { eventBus } from "./eventBus";
import { enqueue } from "../queue/jobQueue";

let listenersRegistered = false;

export function registerSystemEventListeners(): void {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  eventBus.on("application_created", async (payload) => {
    await enqueue({
      id: crypto.randomUUID(),
      type: "application_summary",
      payload,
      entityId: String(payload?.applicationId ?? payload?.id ?? "")
    });
  });

  eventBus.on("document_uploaded", async (payload) => {
    const documentType = String(payload?.documentType ?? "").toLowerCase();

    await enqueue({
      id: crypto.randomUUID(),
      type: documentType.includes("bank") ? "bank_statement_analysis" : "document_ocr",
      payload,
      entityId: String(payload?.documentId ?? payload?.id ?? "")
    });
  });

  eventBus.on("documents_complete", async (payload) => {
    await enqueue({
      id: crypto.randomUUID(),
      type: "application_summary",
      payload,
      entityId: String(payload?.applicationId ?? payload?.id ?? "")
    });
  });

  eventBus.on("offer_created", async (payload) => {
    await enqueue({
      id: crypto.randomUUID(),
      type: "offer_notification",
      payload,
      entityId: String(payload?.offerId ?? payload?.id ?? "")
    });
  });

  eventBus.on("offer_accepted", async (payload) => {
    await enqueue({
      id: crypto.randomUUID(),
      type: "offer_notification",
      payload,
      entityId: String(payload?.offerId ?? payload?.id ?? "")
    });
  });

  eventBus.on("message_received", async (payload) => {
    await enqueue({
      id: crypto.randomUUID(),
      type: "message_notification",
      payload,
      entityId: String(payload?.messageId ?? payload?.id ?? "")
    });
  });
}
