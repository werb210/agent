import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
    clientSecret: process.env.MS_CLIENT_SECRET!
  }
};

const cca = new ConfidentialClientApplication(msalConfig);

export async function getGraphToken(): Promise<string> {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"]
  });

  if (!result?.accessToken) {
    throw new Error("Failed to acquire Microsoft Graph token");
  }

  return result.accessToken;
}
