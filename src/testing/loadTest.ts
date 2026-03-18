const autocannon = require("autocannon") as (options: {
  url: string;
  connections: number;
  duration: number;
}) => Promise<unknown>;

export async function runLoadTest() {
  const url = process.env.LOAD_TEST_URL ?? "http://localhost:5000/health";

  const result = await autocannon({
    url,
    connections: 50,
    duration: 10
  });

  return result;
}
