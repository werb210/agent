import axios from "axios";
import { ENV } from "./env";

const api = axios.create({
  baseURL: ENV.SERVER_URL,
});

export async function logConversation(data: any) {
  try {
    await api.post("/maya/log", data);
  } catch (e) {
    console.error("log failed");
  }
}
