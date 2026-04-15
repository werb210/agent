import { pool } from "../db/index";

export async function secureQuery<T = any>(...args: any[]) {
  const statement = String(args.length >= 3 ? args[2] : args[0]);
  const params = (args.length >= 4 ? args[3] : args[1]) ?? [];
  return pool.request<T>(statement, params);
}

export { pool };
