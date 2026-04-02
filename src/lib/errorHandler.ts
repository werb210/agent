export function handleError(err: any) {
  switch (err.message) {
    case "SERVICE_NOT_READY":
      console.error("API not ready — retry later");
      break;
    case "UNAUTHORIZED":
      console.error("Unauthorized — check JWT token");
      break;
    case "ENDPOINT_DEPRECATED":
      console.error("Deprecated endpoint used");
      break;
    default:
      console.error("Unhandled error:", err);
  }
}
