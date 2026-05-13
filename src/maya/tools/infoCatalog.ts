// AGENT_BLOCK_v4_VISITOR_TOOLS_v1
// Tiny static catalog Maya uses to answer marketing questions on
// the public BF-Website. Kept in-process (no backend call) so
// visitor latency is sub-second and the data does not require
// auth. When marketing copy changes, edit this file and ship.
export type ProductEntry = {
  key: string;
  name: string;
  one_liner: string;
  typical_range_cad: string;
  typical_term: string;
  who_its_for: string;
};

export const PRODUCTS: ReadonlyArray<ProductEntry> = [
  {
    key: "term_loan",
    name: "Term loan",
    one_liner: "Lump-sum financing repaid over a fixed term.",
    typical_range_cad: "$50,000 – $5,000,000",
    typical_term: "1 – 7 years",
    who_its_for: "Established businesses funding equipment, expansion, or acquisitions.",
  },
  {
    key: "line_of_credit",
    name: "Line of credit",
    one_liner: "Revolving access to working capital you draw on as needed.",
    typical_range_cad: "$25,000 – $2,000,000",
    typical_term: "Revolving (annual review)",
    who_its_for: "Businesses managing seasonal cash flow or covering receivables gaps.",
  },
  {
    key: "equipment_financing",
    name: "Equipment financing",
    one_liner: "Loans or leases secured by the equipment itself.",
    typical_range_cad: "$25,000 – $5,000,000",
    typical_term: "2 – 7 years",
    who_its_for: "Trades, construction, manufacturing, fleet operators, and medical practices buying machinery or vehicles.",
  },
  {
    key: "commercial_real_estate",
    name: "Commercial real estate",
    one_liner: "Mortgages, construction loans, and bridge financing on commercial property.",
    typical_range_cad: "$250,000 – $25,000,000+",
    typical_term: "Up to 25 years",
    who_its_for: "Developers, landlords, and owner-occupiers buying or building commercial property.",
  },
  {
    key: "csbfp",
    name: "CSBFP-backed loan",
    one_liner: "Canada Small Business Financing Program — government-guaranteed term loan.",
    typical_range_cad: "Up to $1,150,000",
    typical_term: "Up to 15 years",
    who_its_for: "Small businesses with under $10M in revenue financing tangible assets.",
  },
  {
    key: "mca",
    name: "Merchant cash advance",
    one_liner: "Short-term financing repaid as a percentage of daily sales.",
    typical_range_cad: "$10,000 – $500,000",
    typical_term: "3 – 18 months",
    who_its_for: "High-volume retail, hospitality, and service businesses needing fast capital.",
  },
  {
    key: "factoring",
    name: "Invoice factoring",
    one_liner: "Advance against unpaid customer invoices.",
    typical_range_cad: "$25,000 – $5,000,000",
    typical_term: "Tied to invoice payment terms",
    who_its_for: "B2B businesses with long customer payment cycles.",
  },
  {
    key: "abl",
    name: "Asset-based lending",
    one_liner: "Credit secured against inventory, receivables, or fixed assets.",
    typical_range_cad: "$250,000 – $10,000,000+",
    typical_term: "Revolving",
    who_its_for: "Larger businesses with substantial collateral but uneven profitability.",
  },
  {
    key: "pgi",
    name: "Personal Guarantee Insurance (PGI)",
    one_liner: "Insurance that covers a personal guarantee on a business loan, so a default doesn't expose your personal assets.",
    typical_range_cad: "Up to 80% of guaranteed loan amount",
    typical_term: "Matches underlying loan term",
    who_its_for: "Business owners providing personal guarantees on loans, leases, supplier credit, or surety bonds.",
  },
];

export type QualificationEntry = {
  key: string;
  label: string;
  detail: string;
};

export const QUALIFICATIONS: ReadonlyArray<QualificationEntry> = [
  {
    key: "time_in_business",
    label: "Time in business",
    detail: "Most lenders want at least 6 months trading history. Some products (CSBFP, term loans over $500k) prefer 2+ years.",
  },
  {
    key: "annual_revenue",
    label: "Annual revenue",
    detail: "Working capital starts around $120k/year. Term loans typically want $250k+. Larger facilities ($1M+) usually need $1M+ in revenue.",
  },
  {
    key: "credit",
    label: "Personal credit",
    detail: "Most lenders look at the principal's personal credit. Mid-600s is the practical floor; 700+ unlocks better pricing.",
  },
  {
    key: "documents",
    label: "Documents we typically need",
    detail: "Three to six months of business bank statements, last filed tax return, and a void cheque. Larger requests need financial statements and a debt schedule.",
  },
  {
    key: "use_of_funds",
    label: "Use of funds",
    detail: "Be specific. Lenders match products to purpose — working capital, equipment, real estate, acquisition, refinance, expansion.",
  },
];

export function getProduct(key: string): ProductEntry | null {
  const k = key.trim().toLowerCase();
  return PRODUCTS.find((p) => p.key === k) ?? null;
}

export function getQualification(key: string): QualificationEntry | null {
  const k = key.trim().toLowerCase();
  return QUALIFICATIONS.find((q) => q.key === k) ?? null;
}
