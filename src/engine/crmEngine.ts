const nativeFetch = globalThis["fetch"];
export async function pushToCRM(payload: unknown) {
  if (!process.env.CRM_WEBHOOK_URL) return;

  const response = await nativeFetch(process.env.CRM_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`CRM webhook failed: ${response.status}`);
  }
}
