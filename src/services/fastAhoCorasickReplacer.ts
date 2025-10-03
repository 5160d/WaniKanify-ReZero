import type { ReplacementVocabulary, ReplacementDetail } from "~src/services/textReplacer"
import { AhoCorasick, computeIndexMap } from "~src/services/textMatcher/ahoCorasick"
import {
  __WK_CLASS_REPLACEMENT_CONTAINER,
  __WK_CLASS_REPLACEMENT,
  __WK_DATA_CONTAINER,
  __WK_DATA_ORIGINAL,
  __WK_DATA_READING
} from '~src/internal/tokens'

const isWordLikeCodeUnit = (char: string | null): boolean => {
  if (!char) return false
  return /[\p{L}\p{N}_'-]/u.test(char)
}

/**
 * Fast Aho-Corasick-based text replacer optimized for small to medium pages.
 * Uses efficient chunk processing with the superior Aho-Corasick algorithm
 * for better performance than individual node processing.
 */
export class FastAhoCorasickReplacer {
  private vocabulary: ReplacementVocabulary = new Map()
  private blacklist: Set<string> = new Set()
  private automaton: AhoCorasick | null = null
  private caseSensitive: boolean = false

  setVocabulary(vocabulary: ReplacementVocabulary, blacklist: Set<string>, caseSensitive: boolean = false): void {
    this.vocabulary = vocabulary
    this.blacklist = blacklist
    this.caseSensitive = caseSensitive
    this.buildAutomaton()
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

          // Skip if already processed
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

    // Process each text node
    textNodes.forEach(node => this.replaceTextNode(node))
  }

  private replaceTextNode(node: Text): void {
    if (!this.automaton || !node.parentNode) return

    const text = node.textContent || ''
    if (!text.trim()) return

    // Use Aho-Corasick to find matches
    const { characters, indexMap } = computeIndexMap(text)
    const normalizedCharacters = this.caseSensitive
      ? characters
      : characters.map((char) => char.toLowerCase())

    const matches = this.automaton.search(normalizedCharacters)
    if (matches.length === 0) return

    // Filter matches with word boundary checking
    const validMatches = matches.filter(match => {
      const start = indexMap[match.start]
      const end = indexMap[match.end] + characters[match.end].length

      if (match.payload.requiresBoundary) {
        const beforeChar = start > 0 ? text.slice(start - 1, start) : null
        const afterChar = end < text.length ? text.slice(end, end + 1) : null

        return !isWordLikeCodeUnit(beforeChar) && !isWordLikeCodeUnit(afterChar)
      }

      return true
    })

    if (validMatches.length === 0) return

    // Create replacement fragment
    const fragment = document.createDocumentFragment()
    let cursor = 0

    validMatches.forEach(match => {
      const start = indexMap[match.start]
      const end = indexMap[match.end] + characters[match.end].length

      // Add text before the match
      if (start > cursor) {
        const segment = text.slice(cursor, start)
        if (segment) {
          fragment.appendChild(document.createTextNode(segment))
        }
      }

      // Add the replacement span
      const span = document.createElement('span')
      span.className = __WK_CLASS_REPLACEMENT
      span.textContent = match.payload.replacement
      span.setAttribute(__WK_DATA_ORIGINAL, match.payload.source)
      
      if (match.payload.reading) {
        span.setAttribute(__WK_DATA_READING, match.payload.reading)
      }

      fragment.appendChild(span)
      cursor = end
    })

    // Add remaining text after last match
    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)))
    }

    // Replace the original text node with the fragment
    node.parentNode.replaceChild(fragment, node)
  }

  /**
   * Alternative implementation that creates container spans like the main TextReplacer
   * for maximum compatibility with existing tooltip and audio systems
   */
  replaceTextNodeWithContainer(node: Text): boolean {
    if (!this.automaton || !node.parentNode) return false

    const text = node.textContent || ''
    if (!text.trim()) return false

    // Use Aho-Corasick to find matches
    const { characters, indexMap } = computeIndexMap(text)
    const normalizedCharacters = this.caseSensitive
      ? characters
      : characters.map((char) => char.toLowerCase())

    const automatonMatches = this.automaton.search(normalizedCharacters)
    
    // Filter matches with word boundary checking and convert to ReplacementDetail
    const matches: ReplacementDetail[] = []
    
    automatonMatches.forEach(match => {
      const start = indexMap[match.start]
      const end = indexMap[match.end] + characters[match.end].length

      if (match.payload.requiresBoundary) {
        const beforeChar = start > 0 ? text.slice(start - 1, start) : null
        const afterChar = end < text.length ? text.slice(end, end + 1) : null

        if (isWordLikeCodeUnit(beforeChar) || isWordLikeCodeUnit(afterChar)) {
          return // Skip this match
        }
      }

      matches.push({
        original: match.payload.source,
        replacement: match.payload.replacement,
        source: match.payload.source,
        reading: match.payload.reading
      })
    })

    if (matches.length === 0) return false

    // Create container span with replacement spans inside (same as TextReplacer)
    const container = this.createReplacementContainer(text, matches)
    node.replaceWith(container)

    return true
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