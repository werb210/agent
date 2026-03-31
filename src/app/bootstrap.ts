export function enforceStartupAuth() {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
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
    console.error("[UNHANDLED]", event.reason);
  });

  eventTarget.addEventListener("error", (event) => {
    console.error("[ERROR]", event.error);
  });
}
