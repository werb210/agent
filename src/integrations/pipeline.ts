import axios from "axios";

export async function pushToPipeline(payload: any) {
  if (!process.env.PIPELINE_URL) return;
  await axios.post(process.env.PIPELINE_URL, payload);
}
