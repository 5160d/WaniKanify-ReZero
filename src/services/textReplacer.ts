import { AhoCorasick, computeIndexMap, type AutomatonPayload } from "~src/services/textMatcher/ahoCorasick"
import type { VocabularyEntry } from "~src/services/vocabulary/types"

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

type NumberReplacementResult = {
  value: string
  changed: boolean
}

type OverrideRule = {
  pattern: RegExp
  replacement: string
  source: string
  reading?: string
  priority: number
}

type PendingMatch = {
  start: number
  end: number
  replacement: string
  source: string
  reading?: string
  priority: number
  original: string
}

const DEFAULT_CONFIG: TextReplacementConfig = {
  caseSensitive: false,
  matchWholeWord: true,
  numbersReplacement: false,
  patternOverrides: undefined
}

const DIGIT_TO_KANJI: Record<string, string> = {
  "0": "\u96f6",
  "1": "\u4e00",
  "2": "\u4e8c",
  "3": "\u4e09",
  "4": "\u56db",
  "5": "\u4e94",
  "6": "\u516d",
  "7": "\u4e03",
  "8": "\u516b",
  "9": "\u4e5d"
}

const normalizeKey = (word: string, caseSensitive: boolean) =>
  caseSensitive ? word : word.toLowerCase()

const ensureGlobalRegex = (pattern: RegExp): RegExp => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  return new RegExp(pattern.source, flags)
}

const isWordLikeCodeUnit = (char: string | null): boolean => {
  if (!char) {
    return false
  }

  return /[\p{L}\p{N}_'-]/u.test(char)
}

export class TextReplacementEngine {
  private config: TextReplacementConfig = { ...DEFAULT_CONFIG }
  private rawVocabulary: ReplacementVocabulary = new Map()
  private blacklistSource: Set<string> = new Set()
  private blacklist: Set<string> = new Set()
  private automaton: AhoCorasick | null = null
  private overrideRules: OverrideRule[] = []
  private nodeOriginalContent: Map<Text, { originalText: string; container?: HTMLElement }> =
    new Map()
  private trackedNodes: Set<Text> = new Set()
  private pendingCompileHandle: number | ReturnType<typeof setTimeout> | null = null

  updateConfig(config: Partial<TextReplacementConfig>): void {
    this.config = { ...this.config, ...config }
    this.rebuildBlacklist()
    this.scheduleCompile()
  }

  setVocabulary(vocabulary: ReplacementVocabulary, blacklist: Set<string>): void {
    this.rawVocabulary = vocabulary
    this.blacklistSource = new Set(blacklist ?? [])
    this.rebuildBlacklist()
    this.scheduleCompile()
  }

  setFromEntries(entries: VocabularyEntry[], blacklist: Set<string>): void {
    const vocabulary: ReplacementVocabulary = new Map()
    const normalizedBlacklist = new Set(
      Array.from(blacklist ?? []).map((entry) => normalizeKey(entry, this.config.caseSensitive))
    )

    entries.forEach((entry) => {
      entry.english.forEach((englishWord) => {
        const trimmed = englishWord.trim()
        if (!trimmed) {
          return
        }

        const normalized = normalizeKey(trimmed, this.config.caseSensitive)
        if (normalizedBlacklist.has(normalized)) {
          return
        }

        vocabulary.set(trimmed, {
          japanese: entry.japanese,
          reading: entry.reading
        })
      })
    })

    this.setVocabulary(vocabulary, blacklist)
  }

  replace(text: string): ReplacementResult {
    const input = text ?? ""

    if (!input.trim()) {
      const numbersResult = this.replaceNumbersIfNeeded(input)
      return { value: numbersResult.value, changed: numbersResult.changed, matches: [] }
    }

    const hasAutomaton = Boolean(this.automaton)
    const hasOverrides = this.overrideRules.length > 0

    if (!hasAutomaton && !hasOverrides) {
      const numbersResult = this.replaceNumbersIfNeeded(input)
      return { value: numbersResult.value, changed: numbersResult.changed, matches: [] }
    }

    const { characters, indexMap } = computeIndexMap(input)
    const normalizedCharacters = this.config.caseSensitive
      ? characters
      : characters.map((char) => char.toLowerCase())

    const pendingMatches: PendingMatch[] = []

    if (hasAutomaton && this.automaton) {
      const automatonMatches = this.automaton.search(normalizedCharacters)
      automatonMatches.forEach((match) => {
        const start = indexMap[match.start]
        const end = indexMap[match.end] + characters[match.end].length

        if (match.payload.requiresBoundary) {
          const beforeChar = start > 0 ? input.slice(start - 1, start) : null
          const afterChar = end < input.length ? input.slice(end, end + 1) : null

          if (isWordLikeCodeUnit(beforeChar) || isWordLikeCodeUnit(afterChar)) {
            return
          }
        }

        pendingMatches.push({
          start,
          end,
          replacement: match.payload.replacement,
          source: match.payload.source,
          reading: match.payload.reading,
          priority: match.payload.priority,
          original: input.slice(start, end)
        })
      })
    }

    if (hasOverrides) {
      for (const rule of this.overrideRules) {
        rule.pattern.lastIndex = 0
        let exec: RegExpExecArray | null

        while ((exec = rule.pattern.exec(input)) !== null) {
          const matchText = exec[0]
          if (!matchText) {
            rule.pattern.lastIndex += 1
            continue
          }

          const start = exec.index ?? 0
          const end = start + matchText.length

          pendingMatches.push({
            start,
            end,
            replacement: rule.replacement,
            source: rule.source,
            reading: rule.reading,
            priority: rule.priority,
            original: matchText
          })

          if (!rule.pattern.global) {
            break
          }
        }
      }
    }

    if (!pendingMatches.length) {
      const numbersResult = this.replaceNumbersIfNeeded(input)
      return { value: numbersResult.value, changed: numbersResult.changed, matches: [] }
    }

    pendingMatches.sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start
      }

      const lengthDiff = (b.end - b.start) - (a.end - a.start)
      if (lengthDiff !== 0) {
        return lengthDiff
      }

      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }

      return 0
    })

    const segments: string[] = []
    const details: ReplacementDetail[] = []
    let cursor = 0

    for (const match of pendingMatches) {
      if (match.start < cursor) {
        continue
      }

      if (match.start > cursor) {
        segments.push(input.slice(cursor, match.start))
      }

      segments.push(match.replacement)
      details.push({
        original: match.original,
        replacement: match.replacement,
        source: match.source,
        reading: match.reading
      })

      cursor = match.end
    }

    if (cursor < input.length) {
      segments.push(input.slice(cursor))
    }

    let output = segments.join("")
    let changed = details.length > 0

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
      matches: details
    }
  }

  replaceNode(node: Text): ReplacementResult {
    const original = node.data
    const result = this.replace(original)

    if (result.changed && original !== result.value) {
      if (result.matches.length > 0) {
        const container = this.createReplacementContainer(result.value, result.matches)

        this.nodeOriginalContent.set(node, {
          originalText: original,
          container
        })
        this.trackedNodes.add(node)

        node.data = result.value
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

  revertNode(node: Text): boolean {
    if (!this.nodeOriginalContent.has(node)) {
      return false
    }

    const record = this.nodeOriginalContent.get(node)!

    if (record.container) {
      record.container.replaceWith(node)
      node.data = record.originalText
    } else {
      node.data = record.originalText
    }

    this.nodeOriginalContent.delete(node)
    this.trackedNodes.delete(node)
    return true
  }

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

  clearHistory(): void {
    this.nodeOriginalContent.clear()
    this.trackedNodes.clear()
  }

  getTrackedNodesCount(): number {
    return this.trackedNodes.size
  }

  private createReplacementContainer(
    text: string,
    matches: ReplacementDetail[]
  ): HTMLElement {
    const container = document.createElement("span")
    container.className = "wanikanify-replacement-container"
    container.setAttribute("data-wanikanify-container", "true")

    const fragment = document.createDocumentFragment()
    let cursor = 0

    matches.forEach((match) => {
      const index = text.indexOf(match.replacement, cursor)

      if (index === -1) {
        return
      }

      if (index > cursor) {
        const segment = text.slice(cursor, index)
        if (segment) {
          fragment.append(document.createTextNode(segment))
        }
      }

      const span = document.createElement("span")
      span.className = "wanikanify-replacement"
      span.textContent = match.replacement
      span.setAttribute("data-wanikanify-original", match.source ?? match.original)
      if (match.reading) {
        span.setAttribute("data-wanikanify-reading", match.reading)
      }

      fragment.append(span)
      cursor = index + match.replacement.length
    })

    if (cursor < text.length) {
      fragment.append(document.createTextNode(text.slice(cursor)))
    }

    if (!fragment.childNodes.length) {
      fragment.append(document.createTextNode(text))
    }

    container.append(fragment)
    return container
  }

  private replaceNumbersIfNeeded(value: string): NumberReplacementResult {
    if (!this.config.numbersReplacement || !value) {
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

  private rebuildBlacklist(): void {
    this.blacklist = new Set(
      Array.from(this.blacklistSource ?? []).map((entry) => normalizeKey(entry, this.config.caseSensitive))
    )
  }

  private cancelPendingCompile(): void {
    if (this.pendingCompileHandle === null) {
      return
    }

    if (
      typeof window !== "undefined" &&
      typeof window.cancelIdleCallback === "function" &&
      typeof this.pendingCompileHandle === "number"
    ) {
      window.cancelIdleCallback(this.pendingCompileHandle)
    } else {
      clearTimeout(this.pendingCompileHandle as ReturnType<typeof setTimeout>)
    }

    this.pendingCompileHandle = null
  }

  private scheduleCompile(): void {
    this.cancelPendingCompile()

    const run = () => {
      this.pendingCompileHandle = null
      this.compileRules()
    }

    if (
      typeof window !== "undefined" &&
      typeof window.requestIdleCallback === "function"
    ) {
      this.pendingCompileHandle = window.requestIdleCallback(run, { timeout: 100 })
    } else {
      this.pendingCompileHandle = setTimeout(run, 0)
    }
  }

  private compileRules(): void {
    const { patternOverrides, matchWholeWord } = this.config
    const automatonEntries: Array<{ key: string; payload: Omit<AutomatonPayload, "length"> }> = []
    const overrideRules: OverrideRule[] = []
    let priority = 0

    for (const [english, data] of this.rawVocabulary.entries()) {
      const trimmed = english?.trim()
      if (!trimmed) {
        continue
      }

      const normalizedKey = normalizeKey(trimmed, this.config.caseSensitive)

      if (this.blacklist.has(normalizedKey)) {
        continue
      }

      const overridePattern =
        patternOverrides?.get(english) ?? patternOverrides?.get(normalizedKey)

      if (overridePattern) {
        overrideRules.push({
          pattern: ensureGlobalRegex(overridePattern),
          replacement: data.japanese,
          source: trimmed,
          reading: data.reading,
          priority: priority++
        })
        continue
      }

      automatonEntries.push({
        key: normalizedKey,
        payload: {
          key: trimmed,
          replacement: data.japanese,
          source: trimmed,
          reading: data.reading,
          priority: priority++,
          requiresBoundary: matchWholeWord
        }
      })
    }

    if (automatonEntries.length) {
      const automaton = new AhoCorasick()
      automatonEntries.forEach((entry) => automaton.add(entry.key, entry.payload))
      automaton.build()
      this.automaton = automaton
    } else {
      this.automaton = null
    }

    this.overrideRules = overrideRules
  }
}

export const createReplacementVocabularyFromEntries = (
  entries: VocabularyEntry[]
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
