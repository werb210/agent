export type ApiResponseEnvelope<T = unknown> = {
  status: "ok" | "error" | "not_ready";
  error?: string;
  data?: T;
};

export function assertApiResponse<T>(data: ApiResponseEnvelope<T> | unknown): T {
  if (!data || typeof data !== "object" || typeof (data as ApiResponseEnvelope<T>).status !== "string") {
    throw new Error("Invalid API response");
  }

  const envelope = data as ApiResponseEnvelope<T>;

  if (envelope.status !== "ok") {
    throw new Error(envelope.error || "Request failed");
  }

  return envelope.data as T;
}
