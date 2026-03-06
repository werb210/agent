export type Transaction = {
  amount: number;
  description?: string;
};

export type BankAnalysisPayload = {
  applicationId: string;
  statementId?: string;
  transactions: Transaction[];
};

function parseTransactions(payload: BankAnalysisPayload): Transaction[] {
  return payload.transactions ?? [];
}

function computeBalances(transactions: Transaction[]): { credits: number; debits: number; net: number } {
  const credits = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const debits = transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return {
    credits,
    debits,
    net: credits - debits
  };
}

function detectNSFs(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => (tx.description ?? "").toLowerCase().includes("nsf"));
}

export async function runBankAnalysis(payload: BankAnalysisPayload): Promise<void> {
  const transactions = parseTransactions(payload);
  const balances = computeBalances(transactions);
  const nsfEvents = detectNSFs(transactions);
  const summary = {
    transaction_count: transactions.length,
    balances,
    nsf_count: nsfEvents.length
  };

  const apiBase = process.env.BF_SERVER_API;
  if (!apiBase) {
    throw new Error("BF_SERVER_API missing");
  }

  const response = await fetch(`${apiBase}/api/banking/analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAYA_SECRET ?? ""}`
    },
    body: JSON.stringify({
      applicationId: payload.applicationId,
      statementId: payload.statementId,
      transactions,
      summary
    })
  });

  if (!response.ok) {
    throw new Error(`bankAnalysis.ts failed: ${response.status}`);
  }
}

export default runBankAnalysis;
