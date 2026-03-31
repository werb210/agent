interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorageOrFail(): StorageLike {
  const storage = (globalThis as { localStorage?: StorageLike }).localStorage;

  if (!storage) {
    throw new Error("[AUTH BLOCK] STORAGE UNAVAILABLE");
  }

  return storage;
}

export function getTokenOrFail(): string {
  const token = getStorageOrFail().getItem("token");

  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    throw new Error("[AUTH BLOCK]");
  }

  return token;
}

export function saveToken(token: string): void {
  if (!token || token.trim() === "") {
    throw new Error("[TOKEN SAVE FAILED]");
  }

  const storage = getStorageOrFail();
  storage.setItem("token", token);

  const verify = storage.getItem("token");

  if (!verify) {
    throw new Error("[TOKEN WRITE FAILURE]");
  }
}

export function clearToken(): void {
  getStorageOrFail().removeItem("token");
}
