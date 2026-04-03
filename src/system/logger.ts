export function log(event: string, data?: unknown) {
  console.log(
    JSON.stringify({
      event,
      data,
      ts: Date.now(),
    })
  );
}
