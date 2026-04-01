const nativeFetch = globalThis["fetch"];
export async function sendSlackAlert(message: string) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  await nativeFetch(process.env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}
