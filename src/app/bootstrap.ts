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
