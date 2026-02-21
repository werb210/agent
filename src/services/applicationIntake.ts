import axios from "axios";

type ApplicationContext = {
  revenue?: number;
  yearsInBusiness?: number;
  requestedAmount?: number;
  purpose?: string;
  email?: string;
  phone?: string;
};

const REQUIRED_FIELDS: Array<keyof ApplicationContext> = [
  "revenue",
  "yearsInBusiness",
  "requestedAmount",
  "purpose",
  "email",
  "phone"
];

function extractNumber(value: string): number | undefined {
  const match = value.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function extractNumberNearKeyword(value: string, keyword: string): number | undefined {
  const pattern = new RegExp(`${keyword}[^\\d]*(\\d+(?:\\.\\d+)?)`, "i");
  const match = value.replace(/,/g, "").match(pattern);
  return match?.[1] ? Number(match[1]) : undefined;
}

export function extractApplicationFields(context: ApplicationContext, message: string): ApplicationContext {
  const next = { ...context };
  const lower = message.toLowerCase();

  if (lower.includes("revenue")) {
    const revenue = extractNumberNearKeyword(message, "revenue") ?? extractNumber(message);
    if (revenue !== undefined) {
      next.revenue = revenue;
    }
  }

  if (lower.includes("years")) {
    const yearsFromPhrase = message.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s+years?/i);
    const years = yearsFromPhrase?.[1]
      ? Number(yearsFromPhrase[1])
      : extractNumberNearKeyword(message, "years") ?? extractNumber(message);
    if (years !== undefined) {
      next.yearsInBusiness = years;
    }
  }

  if (lower.includes("$") || lower.includes("amount")) {
    const requestedAmount = extractNumber(message);
    if (requestedAmount !== undefined) {
      next.requestedAmount = requestedAmount;
    }
  }

  if (lower.includes("purpose")) {
    const purposeMatch = message.match(/purpose[:\-]?\s*(.*)$/i);
    next.purpose = purposeMatch?.[1]?.trim() || message.trim();
  }

  const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) {
    next.email = emailMatch[0];
  }

  const phoneMatch = message.match(/\+?\d[\d\s().-]{7,}\d/);
  if (phoneMatch) {
    next.phone = phoneMatch[0].trim();
  }

  return next;
}

export function hasRequiredApplicationFields(context: ApplicationContext): boolean {
  return REQUIRED_FIELDS.every((field) => {
    const value = context[field];
    return typeof value === "string" ? value.trim().length > 0 : value !== undefined;
  });
}

export async function createDraftApplication(context: ApplicationContext): Promise<unknown> {
  const baseUrl = process.env.STAFF_SERVER_URL;

  if (!baseUrl) {
    throw new Error("STAFF_SERVER_URL is not configured.");
  }

  const response = await axios.post(`${baseUrl}/api/applications/create-draft`, context);
  return response.data;
}
