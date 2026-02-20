export function generateDocumentChecklist(data: any) {
  const base = [
    "6 months bank statements",
    "Driver license",
    "Void cheque"
  ];

  if (data.funding_amount > 250000) {
    base.push("Interim financial statements");
  }

  if (data.industry?.includes("construction")) {
    base.push("Equipment list");
  }

  return base;
}
