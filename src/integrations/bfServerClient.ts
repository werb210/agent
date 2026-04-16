import { callMaya } from "../api/maya";

export async function callBFServer<T>(path: string, payload?: any): Promise<T> {
  const baseUrl = process.env.SERVER_URL || process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("SERVER_URL not configured");
  }

  const normalizedPath = /^https?:\/\//i.test(path) ? path : `${baseUrl}${path}`;
  const result = await callMaya(normalizedPath, payload);

  if (!result) {
    console.error("BF SERVER EMPTY RESPONSE:", path);
    throw new Error("Empty BF server response");
  }

  return result as T;
}

type DbCompatResult<T = any> = {
  rows: T[];
  recordset: T[];
  rowCount: number;
};

async function queryCompat<T = any>(text: string, values?: any[]): Promise<DbCompatResult<T>> {
  try {
    const rows = await callBFServer<T[]>("/api/db/query", { text, values: values || [] });
    const safeRows = Array.isArray(rows) ? rows : [];
    return {
      rows: safeRows,
      recordset: safeRows,
      rowCount: safeRows.length,
    };
  } catch (error) {
    console.warn("[TODO] BF-Server endpoint /api/db/query unavailable; returning safe empty result", {
      text,
      error,
    });

    return {
      rows: [],
      recordset: [],
      rowCount: 0,
    };
  }
}

export const pool = {
  query: queryCompat,
  request: queryCompat,
};
