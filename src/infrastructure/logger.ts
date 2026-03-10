import pino from "pino";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info"
});

export const logger = {
  info(message: unknown, meta?: Record<string, unknown>) {
    if (typeof message === "string") {
      baseLogger.info(meta ?? {}, message);
      return;
    }
    baseLogger.info({ ...meta, value: message });
  },
  warn(message: unknown, meta?: Record<string, unknown>) {
    if (typeof message === "string") {
      baseLogger.warn(meta ?? {}, message);
      return;
    }
    baseLogger.warn({ ...meta, value: message });
  },
  debug(message: unknown, meta?: Record<string, unknown>) {
    if (typeof message === "string") {
      baseLogger.debug(meta ?? {}, message);
      return;
    }
    baseLogger.debug({ ...meta, value: message });
  },
  error(message: unknown, meta?: Record<string, unknown>) {
    if (typeof message === "string") {
      baseLogger.error(meta ?? {}, message);
      return;
    }
    baseLogger.error({ ...meta, value: message });
  }
};
