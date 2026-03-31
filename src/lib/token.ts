export function getTokenOrFail(): string {
  const token = globalThis.__AUTH_TOKEN__;

  if (!token) {
    throw new Error("FATAL: NO RUNTIME TOKEN");
  }

  return token;
}

export function setRuntimeToken(token: string): void {
  globalThis.__AUTH_TOKEN__ = token;

  if (!globalThis.__AUTH_TOKEN__) {
    throw new Error("TOKEN SET FAILED");
  }
}
