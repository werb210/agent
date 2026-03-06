import crypto from "crypto";
import { enqueue } from "../queue/jobQueue";
import { eventBus } from "./eventBus";

let listenersRegistered = false;

function queueEventJob(type: string, entityId: string, payload: unknown): void {
  enqueue({
    id: crypto.randomUUID(),
    type,
    payload: {
      ...((payload as Record<string, unknown>) ?? {}),
      entityId
    },
    createdAt: Date.now()
  });
}

export function registerListeners(): void {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  eventBus.on("application_created", (event) => {
    queueEventJob("application_summary", String(event?.applicationId ?? event?.id ?? ""), event);
  });

  eventBus.on("document_uploaded", (event) => {
    const documentType = String(event?.documentType ?? "").toLowerCase();
    queueEventJob(
      documentType.includes("bank") ? "bank_statement_analysis" : "document_ocr",
      String(event?.documentId ?? event?.id ?? ""),
      event
    );
  });

  eventBus.on("documents_complete", (event) => {
    queueEventJob("application_summary", String(event?.applicationId ?? event?.id ?? ""), event);
  });

  eventBus.on("offer_created", (event) => {
    queueEventJob("offer_notification", String(event?.offerId ?? event?.id ?? ""), event);
  });

  eventBus.on("offer_accepted", (event) => {
    queueEventJob("offer_notification", String(event?.offerId ?? event?.id ?? ""), event);
  });

  eventBus.on("message_received", (event) => {
    queueEventJob("message_notification", String(event?.messageId ?? event?.id ?? ""), event);
  });
}
