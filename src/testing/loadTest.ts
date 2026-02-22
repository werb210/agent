import autocannon from "autocannon";

export async function runLoadTest() {
  const result = await autocannon({
    url: "http://localhost:4000/health",
    connections: 50,
    duration: 10
  });

  return result;
}
