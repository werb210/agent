import { enqueueJob } from "../queue/queue";
import { eventBus } from "./eventBus";

let listenersRegistered = false;

export function registerListeners(): void {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  eventBus.on("application_created", (event) => {
    enqueueJob({
      type: "application_summary",
      entityId: String(event?.applicationId ?? event?.id ?? ""),
      payload: event
    });
  });

  eventBus.on("document_uploaded", (event) => {
    const documentType = String(event?.documentType ?? "").toLowerCase();

    enqueueJob({
      type: documentType.includes("bank") ? "bank_statement_analysis" : "document_ocr",
      entityId: String(event?.documentId ?? event?.id ?? ""),
      payload: event
    });
  });

  eventBus.on("documents_complete", (event) => {
    enqueueJob({
      type: "application_summary",
      entityId: String(event?.applicationId ?? event?.id ?? ""),
      payload: event
    });
  });

  eventBus.on("offer_created", (event) => {
    enqueueJob({
      type: "offer_notification",
      entityId: String(event?.offerId ?? event?.id ?? ""),
      payload: event
    });
  });

  eventBus.on("offer_accepted", (event) => {
    enqueueJob({
      type: "offer_notification",
      entityId: String(event?.offerId ?? event?.id ?? ""),
      payload: event
    });
  });

  eventBus.on("message_received", (event) => {
    enqueueJob({
      type: "message_notification",
      entityId: String(event?.messageId ?? event?.id ?? ""),
      payload: event
    });
  });
}
