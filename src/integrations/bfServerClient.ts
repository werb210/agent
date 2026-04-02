import { callMaya } from "../api/maya";

export async function callBFServer<T>(path: string, payload?: any): Promise<T> {
  const result = await callMaya(path, payload);

  if (!result) {
    console.error("BF SERVER EMPTY RESPONSE:", path);
    throw new Error("Empty BF server response");
  }

  return result as T;
}
