import axios from "axios";

const api = axios.create({
  baseURL: "https://server.boreal.financial"
});

api.interceptors.request.use((config) => {
  const token = process.env.AGENT_API_TOKEN;

  if (!token) {
    throw new Error("Missing AGENT_API_TOKEN");
  }

  console.log("AGENT API:", config.url);

  if (config.headers && typeof (config.headers as any).set === "function") {
    (config.headers as any).set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = (config.headers || {}) as any;
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
