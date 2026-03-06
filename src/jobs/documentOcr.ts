import { extractTextFromDocument } from "../engine/ocrEngine";

export type DocumentOcrPayload = {
  documentId: string;
  documentUrl: string;
  documentType?: string;
};

type OcrResult = {
  documentType: string;
  fields: Record<string, string>;
  confidence: number;
};

function detectDocumentType(payload: DocumentOcrPayload): string {
  if (payload.documentType) return payload.documentType;

  const url = payload.documentUrl.toLowerCase();
  if (url.includes("bank")) return "bank_statement";
  if (url.includes("tax")) return "tax_document";
  return "general_document";
}

function toStructuredFields(rawText: string): Record<string, string> {
  return {
    rawText
  };
}

export async function runDocumentOCR(payload: DocumentOcrPayload): Promise<OcrResult> {
  const documentType = detectDocumentType(payload);
  const text = await extractTextFromDocument(payload.documentUrl);

  const result: OcrResult = {
    documentType,
    fields: toStructuredFields(text),
    confidence: text ? 0.9 : 0
  };

  return result;
}

export default runDocumentOCR;
