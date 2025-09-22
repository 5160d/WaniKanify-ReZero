// Centralized logging utility with a uniform, lint-friendly format.
// Format: [WK] [LEVEL] msg ...meta (note the space after the base prefix)
// - Provides a single standardized prefix (no alternate forms).
// - `hardcoded-ui-string` rule treats any string starting with "[WK]" inside log.* calls as developer diagnostics.
// - Debug statements are elided in production builds.

const ENV = (process.env.NODE_ENV || 'production').toLowerCase()
const isProd = ENV === 'production'
const BASE_PREFIX = '[WK]'

type Fn = (...args: unknown[]) => void
interface Logger { debug: Fn; info: Fn; warn: Fn; error: Fn }

function format(level: string, args: unknown[]): unknown[] {
  if (!args.length) return [BASE_PREFIX, `[${level}]`]
  const [first, ...rest] = args
  if (typeof first === 'string') {
    return [BASE_PREFIX, `[${level}]`, first, ...rest]
  }
  return [BASE_PREFIX, `[${level}]`, ...args]
}

const c = globalThis.console
export const log: Logger = {
  debug: isProd ? () => {} : (...args) => c.debug(...format('DEBUG', args)),
  info: (...args) => c.info(...format('INFO', args)),
  warn: (...args) => c.warn(...format('WARN', args)),
  error: (...args) => c.error(...format('ERROR', args))
}

export default log
