import { checkHealth } from "../health";

export async function checkServerHealth() {
  await checkHealth();
  return true;
}
