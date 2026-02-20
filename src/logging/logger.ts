export function logAgentEvent(data: any) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    })
  );
}
