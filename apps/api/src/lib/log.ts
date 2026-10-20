import pino from "pino";
import { env } from "../env.js";

/**
 * One structured logger for the whole API. Every request, every pipeline phase, every model
 * call and every external call logs one JSON line with a duration, so a run can be followed
 * end to end from the log alone. Level and format are settings (LOG_LEVEL, LOG_FORMAT).
 */
export const log = pino({
  level: env.LOG_LEVEL,
  base: { service: "clinix-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: { paths: ["*.token", "*.apiKey", "req.headers.authorization", "req.headers['x-guest-id']"], censor: "[redacted]" },
  transport: env.LOG_FORMAT === "pretty" ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname,service" } } : undefined,
});

/** Times an async step and logs its outcome with the given fields. */
export async function timed<T>(name: string, fields: Record<string, unknown>, fn: () => Promise<T>): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    log.info({ ...fields, step: name, ms: Date.now() - started }, `${name} ok`);
    return result;
  } catch (err) {
    log.error({ ...fields, step: name, ms: Date.now() - started, err: err instanceof Error ? { message: err.message, name: err.name } : String(err) }, `${name} failed`);
    throw err;
  }
}
