import { ConfidentialClientApplication } from "@azure/msal-node";
import { AppError } from "../errors/AppError";

function buildClient() {
  const clientId = process.env.MS_CLIENT_ID;
  const tenantId = process.env.MS_TENANT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  if (!clientId || !tenantId || !clientSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("internal_error", 500, "Missing Microsoft OAuth credentials");
    }

    return null;
  }

  return new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret
    }
  });
}

export async function getGraphToken(): Promise<string> {
  const cca = buildClient();

  if (!cca) {
    throw new AppError("internal_error", 500, "Microsoft Graph credentials are not configured");
  }

  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"]
  });

  if (!result?.accessToken) {
    throw new AppError("upstream_error", 502, "Failed to acquire Microsoft Graph token");
  }

  return result.accessToken;
}
