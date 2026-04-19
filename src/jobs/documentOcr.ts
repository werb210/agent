import { callBFServer } from "../integrations/bfServerClient.js";
import { logger } from "../infrastructure/logger.js";

export interface OcrJob {
  documentId: string;
  applicationId: string;
  category: string;
  storageUrl: string;
}

export async function processDocumentOcr(job: OcrJob): Promise<void> {
  const downloadResponse = await fetch(job.storageUrl);
  if (!downloadResponse.ok) {
    throw new Error(`Unable to download document: ${downloadResponse.status}`);
  }

  const documentBuffer = Buffer.from(await downloadResponse.arrayBuffer());

  const mlUrl = process.env.ML_SERVICE_URL ?? "http://localhost:8001";
  const ocrResponse = await fetch(`${mlUrl}/ocr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: job.storageUrl,
      category: job.category,
      fileBase64: documentBuffer.toString("base64"),
    }),
  });

  if (!ocrResponse.ok) {
    throw new Error(`OCR service returned ${ocrResponse.status}`);
  }

  const ocrData = await ocrResponse.json();

  const category = job.category.toLowerCase();
  const isBanking = category.includes("banking") || category === "bank_statement";
  const isFinancial = ["financial_statements", "income_statement", "balance_sheet"].includes(category);

  if (isBanking) {
    await callBFServer(`/api/applications/${job.applicationId}/banking-analysis`, {
      documentId: job.documentId,
      ocrData,
    });
  } else if (isFinancial) {
    await callBFServer(`/api/applications/${job.applicationId}/financials`, {
      documentId: job.documentId,
      ocrData,
    });
  } else {
    await callBFServer(`/api/documents/${job.documentId}/ocr-results`, {
      ocrData,
    });
  }

  logger.info("ocr_complete", { documentId: job.documentId, category: job.category });
}

export default processDocumentOcr;
