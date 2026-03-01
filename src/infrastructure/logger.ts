import pino from "pino";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info"
});

type LogMeta = Record<string, unknown> | undefined;

function logWithMeta(level: "info" | "error" | "warn", message: unknown, meta?: LogMeta) {
  if (typeof message === "string") {
    if (meta) {
      baseLogger[level](meta, message);
      return;
    }

    baseLogger[level](message);
    return;
  }

  if (meta) {
    baseLogger[level]({ value: message, ...meta });
    return;
  }

  baseLogger[level]({ value: message });
}

export const logger = {
  info(message: unknown, meta?: LogMeta) {
    logWithMeta("info", message, meta);
  },
  warn(message: unknown, meta?: LogMeta) {
    logWithMeta("warn", message, meta);
  },
  error(message: unknown, meta?: LogMeta) {
    logWithMeta("error", message, meta);
  }
};
