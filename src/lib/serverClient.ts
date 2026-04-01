export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const BASE_URL = process.env.SERVER_URL || "";

function buildUrl(path: string): string {
  if (!path.startsWith("/api/")) {
    throw new Error(`Invalid path: ${path}`);
  }

  return `${BASE_URL}${path}`;
}

export async function serverPost<T>(
  path: string,
  body: unknown,
  authToken?: string
): Promise<T> {
  if (!authToken) {
    throw new Error("Missing auth token");
  }

  const res = await globalThis["fetch"](buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify(body)
  });

  const json: ApiResponse<T> = await res.json() as ApiResponse<T>;

  if (!json.success) {
    throw new Error(json.error);
  }

  return json.data;
}
