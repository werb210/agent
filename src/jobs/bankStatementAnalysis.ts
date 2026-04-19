import { callBFServer } from "../integrations/bfServerClient.js";

export type BankStatementPayload = {
  applicationId: string;
  statementId?: string;
  transactions?: Array<{ amount: number; description?: string }>;
};

function analyze(payload: BankStatementPayload) {
  const transactions = payload.transactions ?? [];
  const credits = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const debits = transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return {
    applicationId: payload.applicationId,
    statementId: payload.statementId,
    transactionCount: transactions.length,
    credits,
    debits,
    net: credits - debits
  };
}

export default async function bankStatementAnalysis(payload: BankStatementPayload): Promise<void> {
  const result = analyze(payload);

  await callBFServer("/api/analysis/bank",  result);
}
