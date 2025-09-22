import type { SiteOverrideSettings } from "~src/components/settings/types"

export type SiteFilterPatterns = {
  block?: string[]
}

export type SiteOverridesConfig = Record<string, SiteOverrideSettings>



type CompiledPattern = {
  pattern: string
  regex: RegExp
  type: 'domain' | 'exact' | 'address-part'
  domainPattern?: string // For domain anchors
  exactUrl?: string // For exact URL matches
}

const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    return parsed.href
  } catch {
    if (!url.startsWith("http")) {
      try {
        return new URL(`https://${url}`).href
      } catch {
        return url
      }
    }

    return url
  }
}



/**
 * Compiles an Adblock Plus style filter pattern into a structured matcher.
 * 
 * Supported patterns:
 * - `|url|` - Exact URL match
 * - `||domain^` - Domain anchor (matches domain and subdomains)
 * - `pattern^` - Address-part pattern with separator
 * 
 * @param pattern The filter pattern to compile
 * @returns Compiled pattern object or null if invalid
 */
const compileAbpPattern = (pattern: string): CompiledPattern | null => {
  const trimmed = pattern?.trim()

  if (!trimmed) {
    return null
  }

  // Check for exact URL match: |url|
  if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
    const exactUrl = trimmed.slice(1, -1)
    return {
      pattern: trimmed,
      regex: new RegExp(`^${escapeRegex(exactUrl)}$`, 'i'),
      type: 'exact',
      exactUrl
    }
  }

  // Check for domain anchor: ||domain^
  if (trimmed.startsWith('||') && trimmed.includes('^')) {
    const domainPart = trimmed.slice(2).replace(/\^.*$/, '')
    if (domainPart) {
      return {
        pattern: trimmed,
        regex: new RegExp('', 'i'), // Will be handled specially in matching
        type: 'domain',
        domainPattern: domainPart
      }
    }
  }

  // Check for address-part with separator ^
  if (trimmed.includes('^')) {
    // First escape special regex characters, but preserve * and ^
    let addressPart = trimmed.replace(/[.+?${}()|[\]\\]/g, "\\$&")
    // Convert * to .*
    addressPart = addressPart.replace(/\*/g, ".*")
    // Convert ^ to word boundary or URL separator
    addressPart = addressPart.replace(/\^/g, '(?=[/?#&]|$)')
    
    try {
      return {
        pattern: trimmed,
        regex: new RegExp(addressPart, 'i'),
        type: 'address-part'
      }
    } catch {
      return null
    }
  }

  // No match - pattern is not a valid Adblock Plus pattern
  return null
}

const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Site filtering service with Adblock Plus style pattern support.
 * 
 * Supports:
 * - Exact URL matching (e.g. |http://example.com/|)
 * - Domain anchors (e.g. ||ads.example.com^)
 * - Address-part patterns with wildcard and separator
 * - Site-specific overrides
 */
export class SiteFilter {
  private blockPatterns: CompiledPattern[] = []
  private compiledOverrides: Array<CompiledPattern & { override: SiteOverrideSettings }> = []

  constructor(config: {
    patterns?: SiteFilterPatterns
    overrides?: SiteOverridesConfig
  } = {}) {
    this.setPatterns(config.patterns ?? {})
    this.setOverrides(config.overrides ?? {})
  }

  setPatterns(patterns: SiteFilterPatterns): void {
    this.blockPatterns = this.compilePatterns(patterns.block ?? [])
  }

  appendBlockPattern(pattern: string): void {
    const compiled = compileAbpPattern(pattern)
    if (compiled) {
      this.blockPatterns.push(compiled)
    }
  }

  setOverrides(overrides: SiteOverridesConfig): void {
    this.compiledOverrides = Object.entries(overrides ?? {})
      .map(([pattern, override]) => {
        const compiled = compileAbpPattern(pattern)
        if (!compiled) {
          return null
        }

        return {
          ...compiled,
          override
        }
      })
      .filter((entry): entry is CompiledPattern & { override: SiteOverrideSettings } =>
        Boolean(entry)
      )
      .sort((a, b) => b.pattern.length - a.pattern.length)
  }

  shouldBlock(url: string): boolean {
    const normalized = normalizeUrl(url)

    return this.blockPatterns.some((compiled) =>
      this.patternMatches(compiled, normalized)
    )
  }





  getOverride(url: string): SiteOverrideSettings | null {
    const normalized = normalizeUrl(url)

    for (const override of this.compiledOverrides) {
      if (this.patternMatches(override, normalized)) {
        return { ...override.override }
      }
    }

    return null
  }

  private compilePatterns(patterns: string[]): CompiledPattern[] {
    return patterns
      .map((pattern) => compileAbpPattern(pattern))
      .filter((entry): entry is CompiledPattern => Boolean(entry))
  }

  private patternMatches(compiled: CompiledPattern, url: string): boolean {
    try {
      const parsed = new URL(url)
      
      switch (compiled.type) {
        case 'exact':
          return compiled.exactUrl === url

        case 'domain':
          if (!compiled.domainPattern) return false
          // Check if hostname exactly matches or is a subdomain
          return parsed.hostname === compiled.domainPattern || 
                 parsed.hostname.endsWith('.' + compiled.domainPattern)

        case 'address-part':
          // Test against full URL for address-part patterns
          return compiled.regex.test(url)

        default:
          return false
      }
    } catch {
      // If URL parsing fails, only address-part patterns can be tested
      return compiled.type === 'address-part' 
        ? compiled.regex.test(url)
        : false
    }
  }


}
