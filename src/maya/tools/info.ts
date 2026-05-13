// AGENT_BLOCK_v4_VISITOR_TOOLS_v1
// Visitor-audience tools that read the static info catalog.
// info.products lists or describes our financing products;
// info.qualifications explains what we typically look for.
import { PRODUCTS, QUALIFICATIONS, getProduct, getQualification, type ProductEntry, type QualificationEntry } from "./infoCatalog.js";

export type InfoProductsArgs = {
  product_key?: string;
};

export type InfoProductsResult = {
  ok: boolean;
  products?: ReadonlyArray<ProductEntry>;
  product?: ProductEntry;
  summary?: string;
};

export async function infoProducts(args: InfoProductsArgs): Promise<InfoProductsResult> {
  const key = typeof args?.product_key === "string" ? args.product_key.trim() : "";
  if (key) {
    const p = getProduct(key);
    if (!p) {
      return {
        ok: true,
        products: PRODUCTS,
        summary: `No product matches "${key}". Available: ${PRODUCTS.map((x) => x.key).join(", ")}.`,
      };
    }
    return { ok: true, product: p, summary: `${p.name}: ${p.one_liner}` };
  }
  return {
    ok: true,
    products: PRODUCTS,
    summary: `We offer ${PRODUCTS.length} financing products: ${PRODUCTS.map((p) => p.name).join(", ")}.`,
  };
}

export const INFO_PRODUCTS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "info.products",
    description:
      "List or describe Boreal Financial's financing products. Call with no arguments to get the full list; call with product_key (e.g. 'term_loan', 'line_of_credit', 'equipment_financing', 'commercial_real_estate', 'csbfp', 'mca', 'factoring', 'abl', 'pgi') to get detail on one.",
    parameters: {
      type: "object",
      properties: {
        product_key: {
          type: "string",
          description: "Optional product identifier. Omit to list all products.",
        },
      },
    },
  },
};

export type InfoQualificationsArgs = {
  key?: string;
};

export type InfoQualificationsResult = {
  ok: boolean;
  qualifications?: ReadonlyArray<QualificationEntry>;
  qualification?: QualificationEntry;
  summary?: string;
};

export async function infoQualifications(args: InfoQualificationsArgs): Promise<InfoQualificationsResult> {
  const key = typeof args?.key === "string" ? args.key.trim() : "";
  if (key) {
    const q = getQualification(key);
    if (!q) {
      return {
        ok: true,
        qualifications: QUALIFICATIONS,
        summary: `No qualification topic matches "${key}". Available: ${QUALIFICATIONS.map((x) => x.key).join(", ")}.`,
      };
    }
    return { ok: true, qualification: q, summary: `${q.label}: ${q.detail}` };
  }
  return {
    ok: true,
    qualifications: QUALIFICATIONS,
    summary: `Common qualification topics: ${QUALIFICATIONS.map((x) => x.label).join(", ")}.`,
  };
}

export const INFO_QUALIFICATIONS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "info.qualifications",
    description:
      "Explain what Boreal Financial typically looks for in a financing application. Topics: time_in_business, annual_revenue, credit, documents, use_of_funds. Call with no arguments for the full list; call with a key for detail on one topic.",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Optional qualification topic key. Omit to list all topics.",
        },
      },
    },
  },
};
