export const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('MISSING_API_URL');
}
