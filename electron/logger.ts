import { app } from 'electron'
import { join } from 'path'
import { createWriteStream, mkdirSync } from 'fs'

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Only log debug in dev
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info'

let logStream: ReturnType<typeof createWriteStream> | null = null

function getLogStream(): ReturnType<typeof createWriteStream> | null {
  if (logStream) return logStream
  try {
    const logDir = join(app.getPath('userData'), 'logs')
    mkdirSync(logDir, { recursive: true })
    const logFile = join(logDir, `flowgit-${new Date().toISOString().split('T')[0]}.log`)
    logStream = createWriteStream(logFile, { flags: 'a' })
    return logStream
  } catch {
    return null
  }
}

/**
 * Sanitize a log message to remove credentials.
 * Redacts: Bearer tokens, basic auth, URL credentials.
 */
function sanitize(msg: string): string {
  return msg
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer ***')
    .replace(/Basic\s+[A-Za-z0-9+/=]+/g, 'Basic ***')
    .replace(/\/\/[^@\s]+@/g, '//***@')
    .replace(/token[=:]\s*[A-Za-z0-9\-._~+/]+/gi, 'token=***')
    .replace(/password[=:]\s*\S+/gi, 'password=***')
}

function log(level: LogLevel, namespace: string, ...args: unknown[]): void {
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[MIN_LEVEL]) return

  const ts = new Date().toISOString()
  const parts = args.map((a) => {
    if (typeof a === 'string') return sanitize(a)
    if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`
    return JSON.stringify(a)
  })

  const line = `[${ts}] [${level.toUpperCase()}] [${namespace}] ${parts.join(' ')}`

  // Console output (dev-friendly)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)

  // File output
  try {
    getLogStream()?.write(line + '\n')
  } catch {
    // Don't crash if logging fails
  }
}

export function createLogger(namespace: string) {
  return {
    debug: (...args: unknown[]) => log('debug', namespace, ...args),
    info: (...args: unknown[]) => log('info', namespace, ...args),
    warn: (...args: unknown[]) => log('warn', namespace, ...args),
    error: (...args: unknown[]) => log('error', namespace, ...args),
  }
}
