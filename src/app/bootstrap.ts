import { getTokenOrFail } from "../services/token";

export function enforceStartupAuth() {
  try {
    getTokenOrFail();
  } catch {
    const browserWindow = (globalThis as { window?: { location?: { href: string } } }).window;
    if (browserWindow && browserWindow.location) {
      browserWindow.location.href = "/login";
    }
    throw new Error("[BOOT BLOCKED]");
  }
}

export function registerGlobalErrorVisibility() {
  const eventTarget = globalThis as {
    addEventListener?: (event: string, listener: (event: any) => void) => void;
  };

  if (!eventTarget.addEventListener) {
    return;
  }

  eventTarget.addEventListener("unhandledrejection", (event) => {
    console.error("[UNHANDLED PROMISE]", event.reason);
  });

  eventTarget.addEventListener("error", (event) => {
    console.error("[RUNTIME ERROR]", event.error);
  });
}
