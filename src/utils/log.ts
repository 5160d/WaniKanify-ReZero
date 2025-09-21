// Centralized logging utility. Debug logs are stripped or no-op in production builds.
// Rely on NODE_ENV provided by build tooling; fallback to 'production' if undefined in runtime contexts.

const ENV = (process.env.NODE_ENV || 'production').toLowerCase()
const isProd = ENV === 'production'

interface Logger {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

// In production, debug is a no-op; other levels pass through.
export const log: Logger = {
  debug: isProd ? () => {} : (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
}

export default log
