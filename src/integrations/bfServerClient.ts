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
