import { extractTextFromDocument } from "../engine/ocrEngine";

export type DocumentOcrPayload = {
  documentId: string;
  documentUrl: string;
  documentType?: string;
};

function detectDocumentType(payload: DocumentOcrPayload): string {
  if (payload.documentType) {
    return payload.documentType;
  }

  const url = payload.documentUrl.toLowerCase();
  if (url.includes("bank")) {
    return "bank_statement";
  }

  if (url.includes("tax")) {
    return "tax_document";
  }

  return "general_document";
}

export async function runDocumentOCR(payload: DocumentOcrPayload): Promise<void> {
  const documentType = detectDocumentType(payload);
  const result = await extractTextFromDocument(payload.documentUrl);

  const apiBase = process.env.BF_SERVER_API;
  if (!apiBase) {
    throw new Error("BF_SERVER_API missing");
  }

  const response = await fetch(`${apiBase}/documents/ocr-result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAYA_SECRET ?? ""}`
    },
    body: JSON.stringify({
      documentId: payload.documentId,
      documentType,
      result
    })
  });

  if (!response.ok) {
    throw new Error(`documentOcr.ts failed: ${response.status}`);
  }
}
