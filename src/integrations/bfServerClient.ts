import { api } from "../lib/api";

export async function callBFServer<T>(
  path: string,
  payload?: any
): Promise<T> {
  return api<T>(path, {
    method: payload ? "POST" : "GET",
    ...(payload ? { body: payload } : {}),
  });
}
