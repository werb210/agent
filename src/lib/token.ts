let runtimeToken: string | null = null;

export function setRuntimeToken(token: string) {
  if (!token || token.trim() === "") {
    throw new Error("[TOKEN SET FAILED] EMPTY TOKEN");
  }

  runtimeToken = token;

  console.log("[TOKEN SET]", token.slice(0, 12));
}

export function getTokenOrFail(): string {
  if (!runtimeToken) {
    throw new Error("[AUTH BLOCK] TOKEN NOT INITIALIZED");
  }

  return runtimeToken;
}

export function enforceAuthReady() {
  try {
    getTokenOrFail();
  } catch {
    throw new Error("[APP BLOCKED] TOKEN NOT READY");
  }
}
