export async function checkServerHealth() {
  try {
    const baseUrl = process.env.BF_SERVER_URL;
    if (!baseUrl) {
      return false;
    }

    const res = await fetch(`${baseUrl}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
