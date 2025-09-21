import { performance } from "node:perf_hooks"

import { TextReplacementEngine } from "../src/services/textReplacer"
import type { VocabularyEntry } from "../src/services/vocabulary/types"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForCompilation = async (
  engine: TextReplacementEngine,
  expected: number,
  timeoutMs = 5000
): Promise<number> => {
  const start = performance.now()
  const internal = engine as unknown as { automaton?: { payloads?: unknown[] } }

  while (performance.now() - start < timeoutMs) {
    const payloadCount = Array.isArray(internal.automaton?.payloads)
      ? internal.automaton?.payloads.length ?? 0
      : 0

    if (payloadCount >= expected && internal.automaton) {
      return performance.now() - start
    }

    await wait(5)
  }

  throw new Error(`Timed out waiting for rules to compile (expected ${expected})`)
}

const buildEntries = (count: number, synonymsPerEntry: number): VocabularyEntry[] => {
  const entries: VocabularyEntry[] = []
  for (let i = 0; i < count; i += 1) {
    const english: string[] = []
    for (let j = 0; j < synonymsPerEntry; j += 1) {
      english.push(`word${i}_${j}`)
    }
    entries.push({
      id: `wanikani:${i}`,
      english,
      japanese: `JP${i}`,
      reading: `reading-${i}`,
      source: "wanikani",
      priority: 2,
      audioUrls: []
    })
  }
  return entries
}

const buildText = (wordCount: number, matchEvery: number | null, vocabEntryCount: number) => {
  const words: string[] = []
  for (let i = 0; i < wordCount; i += 1) {
    if (matchEvery && matchEvery > 0 && i % matchEvery === 0) {
      words.push(`word${i % vocabEntryCount}_0`)
    } else {
      words.push(`filler${i}`)
    }
  }
  return words.join(" ")
}

const measureScenario = (engine: TextReplacementEngine, text: string, iterations: number) => {
  const durations: number[] = []
  let matchesPerRun = 0
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now()
    const result = engine.replace(text)
    durations.push(performance.now() - start)
    if (i === 0) {
      matchesPerRun = result.matches.length
    }
  }

  const sorted = durations.slice().sort((a, b) => a - b)
  const total = durations.reduce((sum, value) => sum + value, 0)
  const average = total / durations.length
  const percentileIndex = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)
  const p95 = sorted[percentileIndex]
  const max = sorted[sorted.length - 1]

  return {
    average,
    p95,
    max,
    matchesPerRun
  }
}

const formatMs = (value: number) => value.toFixed(3)

;(async () => {
  const VOCAB_ENTRIES = 6000
  const SYNONYMS_PER_ENTRY = 3
  const ITERATIONS = 40
  const EXPECTED_RULES = VOCAB_ENTRIES * SYNONYMS_PER_ENTRY

  const engine = new TextReplacementEngine()
  engine.updateConfig({ matchWholeWord: true, numbersReplacement: false, caseSensitive: false })

  const entries = buildEntries(VOCAB_ENTRIES, SYNONYMS_PER_ENTRY)
  engine.setFromEntries(entries, new Set())
  const compileDuration = await waitForCompilation(engine, EXPECTED_RULES)

  const internal = engine as unknown as { automaton?: { payloads?: unknown[] } }
  const ruleCount = Array.isArray(internal.automaton?.payloads) ? internal.automaton?.payloads.length ?? 0 : 0

  const scenarios = [
    { name: "Short text (20 words) no matches", words: 20, matchEvery: null },
    { name: "Short text (20 words) ~1 match", words: 20, matchEvery: 20 },
    { name: "Paragraph (80 words) ~1 match", words: 80, matchEvery: 80 },
    { name: "Paragraph (80 words) ~4 matches", words: 80, matchEvery: 20 },
    { name: "Article section (200 words) ~5 matches", words: 200, matchEvery: 40 },
    { name: "Large block (400 words) ~5 matches", words: 400, matchEvery: 80 }
  ].map((scenario) => ({
    ...scenario,
    text: buildText(scenario.words, scenario.matchEvery, VOCAB_ENTRIES)
  }))

  console.log("=== TextReplacementEngine profiling ===")
  console.log(`Vocabulary entries: ${VOCAB_ENTRIES} (synonyms per entry: ${SYNONYMS_PER_ENTRY})`)
  console.log(`Automaton payloads: ${ruleCount}`)
  console.log(`Compilation wait: ${formatMs(compileDuration)} ms`)

  for (const scenario of scenarios) {
    const stats = measureScenario(engine, scenario.text, ITERATIONS)
    console.log(`\nScenario: ${scenario.name}`)
    console.log(`  Words per text node: ${scenario.words}`)
    console.log(
      `  Approx match frequency: ${
        scenario.matchEvery && scenario.matchEvery > 0 ? `1 per ${scenario.matchEvery} words` : "none"
      }`
    )
    console.log(`  Matches per run: ${stats.matchesPerRun}`)
    console.log(`  Avg replace(): ${formatMs(stats.average)} ms`)
    console.log(`  P95 replace(): ${formatMs(stats.p95)} ms`)
    console.log(`  Max replace(): ${formatMs(stats.max)} ms`)
  }
})().catch((error) => {
  console.error("Profiling failed", error)
  process.exitCode = 1
})
