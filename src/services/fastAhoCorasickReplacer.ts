import { AhoCorasick, computeIndexMap } from "~src/services/textMatcher/ahoCorasick"
import {
  __WK_CLASS_REPLACEMENT_CONTAINER,
  __WK_CLASS_REPLACEMENT,
  __WK_DATA_CONTAINER,
  __WK_DATA_ORIGINAL,
  __WK_DATA_READING
} from '~src/internal/tokens'

export type ReplacementSource = {
  japanese: string
  reading?: string
}

export type ReplacementVocabulary = Map<string, ReplacementSource>

export type TextReplacementConfig = {
  caseSensitive: boolean
  matchWholeWord: boolean
  numbersReplacement: boolean
  patternOverrides?: Map<string, RegExp>
}

export type ReplacementDetail = {
  original: string
  replacement: string
  source: string
  reading?: string
}

export type ReplacementResult = {
  value: string
  changed: boolean
  matches: ReplacementDetail[]
}

const isWordLikeCodeUnit = (char: string | null): boolean => {
  if (!char) return false
  return /[\p{L}\p{N}_'-]/u.test(char)
}

const DIGIT_TO_KANJI: Record<string, string> = {
  "0": "〇",
  "1": "一",
  "2": "二", 
  "3": "三",
  "4": "四",
  "5": "五",
  "6": "六",
  "7": "七",
  "8": "八",
  "9": "九"
}

/**
 * Fast Aho-Corasick-based text replacer optimized for both light and heavy pages.
 * Provides unified replacement logic with superior performance regardless of processing strategy.
 */
export class FastAhoCorasickReplacer {
  private vocabulary: ReplacementVocabulary = new Map()
  private blacklist: Set<string> = new Set()
  private automaton: AhoCorasick | null = null
  private caseSensitive: boolean = false
  private numbersReplacement: boolean = false
  private nodeOriginalContent: Map<Text, { originalText: string; container?: HTMLElement }> = new Map()
  private trackedNodes: Set<Text> = new Set()

  updateConfig(config: Partial<TextReplacementConfig>): void {
    this.numbersReplacement = config.numbersReplacement ?? this.numbersReplacement
    this.caseSensitive = config.caseSensitive ?? this.caseSensitive
    if (config.caseSensitive !== undefined && config.caseSensitive !== this.caseSensitive) {
      this.buildAutomaton()
    }
  }

  setVocabulary(vocabulary: ReplacementVocabulary, blacklist: Set<string>, caseSensitive: boolean = false): void {
    this.vocabulary = vocabulary
    this.blacklist = blacklist
    this.caseSensitive = caseSensitive
    this.buildAutomaton()
  }

  /**
   * Process a single text node - compatible with TextReplacementEngine.replaceNode()
   */
  replaceNode(node: Text): ReplacementResult {
    const original = node.data
    const result = this.replace(original)

    if (result.changed && original !== result.value) {
      if (result.matches.length > 0) {
        const container = this.createReplacementContainer(original, result.matches)

        this.nodeOriginalContent.set(node, {
          originalText: original,
          container
        })
        this.trackedNodes.add(node)

        // Replace the node with the container (don't modify node.data first)
        node.replaceWith(container)
      } else {
        this.nodeOriginalContent.set(node, {
          originalText: original
        })
        this.trackedNodes.add(node)
        node.data = result.value
      }
    }

    return result
  }

  /**
   * Replace text using Aho-Corasick algorithm
   */
  replace(text: string): ReplacementResult {
    const input = text ?? ""

    if (!input.trim()) {
      const numbersResult = this.replaceNumbersIfNeeded(input)
      return { value: numbersResult.value, changed: numbersResult.changed, matches: [] }
    }

    if (!this.automaton) {
      const numbersResult = this.replaceNumbersIfNeeded(input)
      return { value: numbersResult.value, changed: numbersResult.changed, matches: [] }
    }

    // Use Aho-Corasick to find matches
    const { characters, indexMap } = computeIndexMap(input)
    const normalizedCharacters = this.caseSensitive
      ? characters
      : characters.map((char) => char.toLowerCase())

    const automatonMatches = this.automaton.search(normalizedCharacters)
    
    const matches: ReplacementDetail[] = []
    
    automatonMatches.forEach(match => {
      const start = indexMap[match.start]
      const end = indexMap[match.end] + characters[match.end].length

      if (match.payload.requiresBoundary) {
        const beforeChar = start > 0 ? input.slice(start - 1, start) : null
        const afterChar = end < input.length ? input.slice(end, end + 1) : null

        if (isWordLikeCodeUnit(beforeChar) || isWordLikeCodeUnit(afterChar)) {
          return
        }
      }

      matches.push({
        original: input.slice(start, end),
        replacement: match.payload.replacement,
        source: match.payload.source,
        reading: match.payload.reading
      })
    })

    if (matches.length === 0) {
      const numbersResult = this.replaceNumbersIfNeeded(input)
      return { value: numbersResult.value, changed: numbersResult.changed, matches: [] }
    }

    matches.sort((a, b) => {
      const aStart = input.indexOf(a.original)
      const bStart = input.indexOf(b.original)
      
      if (aStart !== bStart) {
        return aStart - bStart
      }
      
      // Prefer longer matches
      return b.original.length - a.original.length
    })

    // Apply replacements
    const segments: string[] = []
    let cursor = 0

    for (const match of matches) {
      const matchStart = input.indexOf(match.original, cursor)
      
      if (matchStart === -1 || matchStart < cursor) {
        continue
      }

      // Add text before the match
      if (matchStart > cursor) {
        segments.push(input.slice(cursor, matchStart))
      }

      segments.push(match.replacement)
      cursor = matchStart + match.original.length
    }

    // Add remaining text
    if (cursor < input.length) {
      segments.push(input.slice(cursor))
    }

    let output = segments.join("")
    let changed = matches.length > 0

    // Apply number replacement
    const numbersResult = this.replaceNumbersIfNeeded(output)
    if (numbersResult.changed) {
      output = numbersResult.value
      changed = true
    }

    if (!changed) {
      output = input
    }

    return {
      value: output,
      changed,
      matches
    }
  }

  /**
   * Revert all tracked nodes
   */
  revertAll(): void {
    this.nodeOriginalContent.forEach((record, node) => {
      if (record.container) {
        record.container.replaceWith(node)
        node.data = record.originalText
      } else {
        node.data = record.originalText
      }
    })

    this.nodeOriginalContent.clear()
    this.trackedNodes.clear()
  }

  /**
   * Get count of tracked nodes for performance monitoring
   */
  getTrackedNodesCount(): number {
    return this.trackedNodes.size
  }

  private replaceNumbersIfNeeded(value: string): { value: string; changed: boolean } {
    if (!this.numbersReplacement || !value) {
      return { value, changed: false }
    }

    let changed = false
    const replaced = value.replace(/\b\d+\b/g, (match) => {
      const converted = this.convertNumberToKanji(match)
      if (converted !== match) {
        changed = true
      }
      return converted
    })

    return { value: replaced, changed }
  }

  private convertNumberToKanji(digits: string): string {
    return digits
      .split("")
      .map((digit) => DIGIT_TO_KANJI[digit] ?? digit)
      .join("")
  }

  private buildAutomaton(): void {
    if (this.vocabulary.size === 0) {
      this.automaton = null
      return
    }

    // Create automaton and add patterns
    const automaton = new AhoCorasick()
    
    for (const [term, source] of this.vocabulary) {
      const normalizedTerm = this.caseSensitive ? term : term.toLowerCase()
      if (!this.blacklist.has(normalizedTerm)) {
        const key = this.caseSensitive ? term : term.toLowerCase()
        automaton.add(key, {
          key: term,
          replacement: source.japanese,
          source: term,
          reading: source.reading,
          priority: 0,
          requiresBoundary: true // Use word boundaries like the main replacer
        })
      }
    }

    automaton.build()
    this.automaton = automaton
  }

  /**
   * Fast replacement of text nodes using Aho-Corasick algorithm
   */
  replaceTextNodesInElement(element: Element): void {
    if (!this.automaton) return

    // Use TreeWalker to find all text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = (node as Text).parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          
          // Skip script, style, and other non-content elements
          const tagName = parent.tagName.toUpperCase()
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT
          }

          if (parent.classList.contains(__WK_CLASS_REPLACEMENT) || 
              parent.classList.contains(__WK_CLASS_REPLACEMENT_CONTAINER)) {
            return NodeFilter.FILTER_REJECT
          }

          return NodeFilter.FILTER_ACCEPT
        }
      }
    )

    const textNodes: Text[] = []
    let current = walker.nextNode()
    while (current) {
      textNodes.push(current as Text)
      current = walker.nextNode()
    }

    textNodes.forEach(node => this.replaceNode(node))
  }

  private createReplacementContainer(text: string, matches: ReplacementDetail[]): HTMLElement {
    const container = document.createElement("span")
    container.className = __WK_CLASS_REPLACEMENT_CONTAINER
    container.setAttribute(__WK_DATA_CONTAINER, "true")

    const fragment = document.createDocumentFragment()
    let cursor = 0

    matches.forEach((match) => {
      const index = text.indexOf(match.original, cursor)

      if (index === -1) {
        return
      }

      // Add text before the match
      if (index > cursor) {
        const segment = text.slice(cursor, index)
        if (segment) {
          fragment.append(document.createTextNode(segment))
        }
      }

      // Add the replacement span
      const span = document.createElement("span")
      span.className = __WK_CLASS_REPLACEMENT
      span.textContent = match.replacement
      span.setAttribute(__WK_DATA_ORIGINAL, match.source ?? match.original)
      if (match.reading) {
        span.setAttribute(__WK_DATA_READING, match.reading)
      }

      fragment.append(span)
      cursor = index + match.original.length
    })

    // Add remaining text after last match
    if (cursor < text.length) {
      fragment.append(document.createTextNode(text.slice(cursor)))
    }

    container.append(fragment)
    return container
  }
}

export const createReplacementVocabularyFromEntries = (
  entries: import('~src/services/vocabulary/types').VocabularyEntry[]
): ReplacementVocabulary => {
  const vocabulary: ReplacementVocabulary = new Map()

  entries?.forEach((entry) => {
    entry.english.forEach((englishWord) => {
      const normalized = englishWord.trim()
      if (!normalized) {
        return
      }

      vocabulary.set(normalized, {
        japanese: entry.japanese,
        reading: entry.reading
      })
    })
  })

  return vocabulary
}