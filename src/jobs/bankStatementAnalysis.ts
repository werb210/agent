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

  const response = await fetch(`${process.env.BF_SERVER_API}/api/analysis/bank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result)
  });

  if (!response.ok) {
    throw new Error(`bankStatementAnalysis.ts failed: ${response.status}`);
  }
}
