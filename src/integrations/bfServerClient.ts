import axios from "axios";

export async function bfServerRequest(
  path: string,
  method: string,
  body?: any
) {
  const baseUrl = process.env.BF_SERVER_URL;
  const token = process.env.BF_SERVER_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("BF_SERVER_URL and BF_SERVER_TOKEN are required");
  }

  const res = await axios.request({
    url: `${baseUrl}${path}`,
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    data: body
  });

  return res.data;
}
