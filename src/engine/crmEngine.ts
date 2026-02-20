import axios from "axios";

export async function pushToCRM(payload: any) {
  if (!process.env.CRM_WEBHOOK_URL) return;

  try {
    await axios.post(process.env.CRM_WEBHOOK_URL, payload);
  } catch (err) {
    console.error("CRM push failed");
  }
}
