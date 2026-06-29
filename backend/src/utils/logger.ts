import { pino, type Logger } from 'pino'

export type { Logger }

export function createLogger(level: string): Logger {
  return pino({
    level,
    base: { service: 'meridian-backend' },
    timestamp: pino.stdTimeFunctions.isoTime,
  })
}
