export function handleError(err: any) {
  if (err.message === "SERVICE_NOT_READY") {
    console.error("Server not ready, retrying...");
    return;
  }

  if (err.message === "UNAUTHORIZED") {
    console.error("Auth failure — check token");
    return;
  }

  if (err.message === "ENDPOINT_DEPRECATED") {
    console.error("Deprecated endpoint called");
    return;
  }

  console.error("Unhandled error:", err);
}
