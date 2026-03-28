export type ApiResponseEnvelope<T = unknown> = {
  success: boolean;
  error?: string;
  data: T;
};

export function assertApiResponse<T>(data: ApiResponseEnvelope<T> | unknown): T {
  if (!data || typeof (data as ApiResponseEnvelope<T>).success !== "boolean") {
    throw new Error("Invalid API contract");
  }

  const envelope = data as ApiResponseEnvelope<T>;

  if (!envelope.success) {
    throw new Error(envelope.error || "API request failed");
  }

  return envelope.data;
}
