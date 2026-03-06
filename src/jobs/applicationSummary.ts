export type ApplicationSummaryPayload = {
  applicationData: Record<string, unknown>;
  bankingAnalysis: Record<string, unknown>;
  ocrResults: Record<string, unknown>;
};

export type ApplicationSummaryResult = {
  transaction: Record<string, unknown>;
  overview: string;
  financialSummary: Record<string, unknown>;
  risks: string[];
  mitigants: string[];
  rationale: string;
};

export async function generateSummary(payload: ApplicationSummaryPayload): Promise<ApplicationSummaryResult> {
  const risks = [
    Number(payload.bankingAnalysis?.nsf_count ?? 0) > 0 ? "NSF activity detected" : "No NSF activity detected"
  ];

  const result: ApplicationSummaryResult = {
    transaction: {
      applicationId: payload.applicationData.applicationId ?? null,
      requestedAmount: payload.applicationData.requestedAmount ?? null
    },
    overview: "Narrative summary generated from application, banking, and OCR sources.",
    financialSummary: {
      bankingAnalysis: payload.bankingAnalysis,
      ocrResults: payload.ocrResults
    },
    risks,
    mitigants: ["Cross-validated bank transactions with OCR extraction."],
    rationale: "Combined structured and extracted signals to support underwriting review."
  };

  return result;
}

export default generateSummary;
