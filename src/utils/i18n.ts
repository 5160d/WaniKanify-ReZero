// Import locale messages from the authoritative /locales directory (Plasmo copies this to _locales on build)
import messages from "../../locales/en/messages.json" assert { type: "json" };
import { log } from "~src/utils/log"

/**
 * Shape of a Chrome extension locale message entry.
 */
interface ChromeLocaleMessage {
  message: string
  description?: string
  placeholders?: Record<string, { content: string; example?: string }>
}

// Runtime cache (single-locale for now; future locales can be added later)
// Cast imported JSON to a strongly typed registry map instead of using 'any'
const registry: Record<string, ChromeLocaleMessage> = messages as Record<string, ChromeLocaleMessage>

const DEV = process.env.NODE_ENV !== 'production'

export type Substitutions = Record<string, string | number | undefined | null>

function applySubstitutions(template: string, subs?: Substitutions): string {
  if (!subs) return template
  return template.replace(/\$(\w+)\$/g, (full, key) => {
    const v = subs[key]
    if (v === undefined || v === null) return ''
    return String(v)
  })
}

/**
 * Translate a key. Fallback strategy:
 * 1. Found: return substituted message.
 * 2. Missing: in dev, warn & return key; in prod, return key.
 */
export function t(key: string, substitutions?: Substitutions): string {
  const entry = registry[key]
  if (!entry) {
    if (DEV) {
      log.warn(`[i18n] Missing key: ${key}`)
    }
    return key
  }
  return applySubstitutions(entry.message, substitutions)
}

/**
 * List all known message keys (useful for tests or tooling)
 */
export function allKeys(): string[] {
  return Object.keys(registry)
}
