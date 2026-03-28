import axios, { AxiosRequestConfig, AxiosResponse, Method } from "axios";

export async function retryFetch(
  url: string,
  options: AxiosRequestConfig = {},
  retries = 3
): Promise<AxiosResponse> {
  const method = (options.method || "GET") as Method;

  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await axios.request({
        url,
        method,
        data: options.data,
        headers: options.headers,
        params: options.params,
        validateStatus: () => true
      });

      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      if (response.status >= 500) {
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
    }
  }

  throw new Error("upstream_failure");
}
