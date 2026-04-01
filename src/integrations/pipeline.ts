const nativeFetch = globalThis["fetch"];
export async function pushToPipeline(payload: unknown) {
  if (!process.env.PIPELINE_URL) return;

  await nativeFetch(process.env.PIPELINE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
