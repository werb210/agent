export async function retryFetch(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, options);

      if (res.ok) {
        return res;
      }

      if (res.status >= 500) {
        continue;
      }

      return res;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
    }
  }

  throw new Error("upstream_failure");
}
