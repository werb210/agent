import fetch from "node-fetch";

export async function pushToPipeline(payload: any) {
  if (!process.env.PIPELINE_URL) return;

  await fetch(process.env.PIPELINE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
