import type { WaniSettings } from "~src/components/settings/types"
import type { WaniKaniAssignment, WaniKaniSubject } from "~src/services/wanikani"
import {
  computeAllowedSrsStages,
  getSelectedSubjectIds,
  type SrsGroupSelection
} from "~src/services/wanikani"
import type { VocabularyEntry } from "~src/services/vocabulary/types"

type VocabularyBuildDependencies = {
  settings: WaniSettings
  subjects: WaniKaniSubject[]
  assignments: WaniKaniAssignment[]
  importedVocabulary?: VocabularyEntry[]
}

type BuildResult = {
  entries: VocabularyEntry[]
  lookupMap: Map<string, VocabularyEntry>
  trie: PrefixTrie
}

type SubjectSelection = {
  includeAll: boolean
  selectedIds: Set<number>
  allowedStages: Set<number>
}

const SOURCE_PRIORITY: Record<VocabularyEntry["source"], number> = {
  custom: 3,
  wanikani: 2,
  imported: 1
}

const normalizeWord = (word: string) => word.trim().toLowerCase()

const uniqueId = (() => {
  let counter = 0
  return (prefix: string) => `${prefix}:${++counter}`
})()

class TrieNode {
  children: Map<string, TrieNode> = new Map()
  isWord = false
}

export class PrefixTrie {
  private root: TrieNode = new TrieNode()

  insert(word: string): void {
    let node = this.root
    const cleaned = normalizeWord(word)

    for (const char of cleaned) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode())
      }

      node = node.children.get(char)!
    }

    node.isWord = true
  }

  has(word: string): boolean {
    let node = this.root
    const cleaned = normalizeWord(word)

    for (const char of cleaned) {
      const next = node.children.get(char)
      if (!next) {
        return false
      }
      node = next
    }

    return node.isWord
  }

  startsWith(prefix: string): boolean {
    let node = this.root
    const cleaned = normalizeWord(prefix)

    for (const char of cleaned) {
      const next = node.children.get(char)
      if (!next) {
        return false
      }
      node = next
    }

    return true
  }

  clear(): void {
    this.root = new TrieNode()
  }
}

export class VocabularyManager {
  private settings: WaniSettings
  private subjects: WaniKaniSubject[] = []
  private assignments: WaniKaniAssignment[] = []
  private importedVocabulary: VocabularyEntry[] = []
  private currentEntries: VocabularyEntry[] = []
  private lookupMap: Map<string, VocabularyEntry> = new Map()
  private trie: PrefixTrie = new PrefixTrie()
  private stageLabelMap: Record<number, string> = {}
  private dirty = true

  constructor({ settings, subjects, assignments, importedVocabulary }: VocabularyBuildDependencies) {
    this.settings = settings
    this.subjects = subjects
    this.assignments = assignments
    this.importedVocabulary = importedVocabulary ?? []
  }

  updateSettings(settings: WaniSettings): void {
    this.settings = settings
    this.dirty = true
  }

  updateWaniKaniData(subjects: WaniKaniSubject[], assignments: WaniKaniAssignment[]): void {
    this.subjects = subjects
    this.assignments = assignments
    this.dirty = true
  }

  updateImportedVocabulary(entries: VocabularyEntry[]): void {
    this.importedVocabulary = entries ?? []
    this.dirty = true
  }

  getEntries(): VocabularyEntry[] {
    if (this.dirty) {
      this.rebuild()
    }
    return this.currentEntries
  }

  getLookupMap(): Map<string, VocabularyEntry> {
    if (this.dirty) {
      this.rebuild()
    }
    return this.lookupMap
  }

  getTrie(): PrefixTrie {
    if (this.dirty) {
      this.rebuild()
    }
    return this.trie
  }

  build(): BuildResult {
    if (this.dirty) {
      this.rebuild()
    }

    return {
      entries: this.currentEntries,
      lookupMap: this.lookupMap,
      trie: this.trie
    }
  }

  private rebuild(): void {
    const blacklist = this.createBlacklist()
    const assignmentsMap = this.createAssignmentMap()
    const selection = this.selectSubjects()

    this.currentEntries = []
    this.lookupMap = new Map()
    this.trie = new PrefixTrie()

    this.buildCustomEntries(blacklist)
    this.buildImportedEntries(blacklist)
    this.buildWaniKaniEntries(assignmentsMap, selection, blacklist)

    this.dirty = false
  }

  private createBlacklist(): Set<string> {
    const blacklist = new Set<string>()

    this.settings.vocabularyBlacklist?.forEach((entry) => {
      const normalized = normalizeWord(entry)
      if (normalized) {
        blacklist.add(normalized)
      }
    })

    return blacklist
  }

  private createAssignmentMap(): Map<number, WaniKaniAssignment> {
    const map = new Map<number, WaniKaniAssignment>()

    this.assignments.forEach((assignment) => {
      map.set(assignment.data.subject_id, assignment)
    })

    return map
  }

  private selectSubjects(): SubjectSelection {
    const selection = this.settings.srsGroups as SrsGroupSelection
    const allowedStages = computeAllowedSrsStages(selection)
    this.stageLabelMap = this.buildStageLabelMap(selection)

    if (!allowedStages.size) {
      return {
        includeAll: false,
        selectedIds: new Set<number>(),
        allowedStages
      }
    }

    if (!this.assignments.length) {
      return {
        includeAll: true,
        selectedIds: new Set<number>(),
        allowedStages
      }
    }

    const selectedIds = getSelectedSubjectIds(this.assignments, selection)

    return {
      includeAll: selectedIds.size === 0,
      selectedIds,
      allowedStages
    }
  }

  private buildCustomEntries(blacklist: Set<string>): void {
    if (!this.settings.customVocabulary?.size) {
      return
    }

    const grouped = new Map<string, { english: Set<string>; japanese: string; reading?: string }>()

    for (const [englishWord, data] of this.settings.customVocabulary.entries()) {
      const normalized = normalizeWord(englishWord)

      if (!normalized || blacklist.has(normalized) || !data?.japanese) {
        continue
      }

      const key = `${data.japanese}||${data.reading ?? ""}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          english: new Set(),
          japanese: data.japanese.trim(),
          reading: data.reading?.trim()
        })
      }

      grouped.get(key)!.english.add(englishWord.trim())
    }

    grouped.forEach(({ english, japanese, reading }) => {
      const englishList = Array.from(english).filter((word) => !blacklist.has(normalizeWord(word)))
      if (!englishList.length) {
        return
      }

      const entry: VocabularyEntry = {
        id: uniqueId("custom"),
        english: englishList,
        japanese,
        reading: reading || undefined,
        source: "custom",
        priority: SOURCE_PRIORITY.custom
      }

      this.addEntry(entry)
    })
  }

  private buildImportedEntries(blacklist: Set<string>): void {
    if (!this.importedVocabulary?.length) {
      return
    }

    this.importedVocabulary.forEach((entry) => {
      const filteredEnglish = entry.english.filter(
        (word) => !blacklist.has(normalizeWord(word))
      )

      if (!filteredEnglish.length || !entry.japanese) {
        return
      }

      const normalizedEntry: VocabularyEntry = {
        ...entry,
        english: filteredEnglish,
        priority: SOURCE_PRIORITY.imported
      }

      this.addEntry(normalizedEntry)
    })
  }

  private buildWaniKaniEntries(
    assignmentsMap: Map<number, WaniKaniAssignment>,
    selection: SubjectSelection,
    blacklist: Set<string>
  ): void {
    if (!selection.includeAll && selection.selectedIds.size === 0) {
      return
    }

    this.subjects.forEach((subject) => {
      if (!selection.includeAll && !selection.selectedIds.has(subject.id)) {
        return
      }

      const englishMeanings = subject.data.meanings
        ?.map((meaning) => meaning.meaning?.trim())
        .filter(Boolean) as string[]

      if (!englishMeanings?.length) {
        return
      }

      const filteredEnglish = englishMeanings.filter(
        (meaning) => !blacklist.has(normalizeWord(meaning))
      )

      if (!filteredEnglish.length) {
        return
      }

      const reading = subject.data.readings?.find((item) => item.primary)?.reading
      const fallbackReading = subject.data.readings?.[0]?.reading
      const assignment = assignmentsMap.get(subject.id)
      const srsStage = assignment?.data.srs_stage
      const srsLevelLabel = this.stageToLabel(srsStage, selection.allowedStages)

      const entry: VocabularyEntry = {
        id: `wanikani:${subject.id}`,
        english: filteredEnglish,
        japanese: subject.data.characters ?? "",
        reading: reading ?? fallbackReading ?? undefined,
        source: "wanikani",
        priority: SOURCE_PRIORITY.wanikani,
        srsStage,
        srsLevelLabel,
        wanikaniSubjectId: subject.id,
        audioUrls: subject.data.pronunciation_audios?.map((audio) => audio.url) ?? []
      }

      this.addEntry(entry)
    })
  }

  private stageToLabel(stage: number | undefined, allowedStages: Set<number>): string | undefined {
    if (typeof stage !== "number") {
      return undefined
    }

    if (!allowedStages.has(stage)) {
      return undefined
    }

    return this.stageLabelMap[stage]
  }

  private buildStageLabelMap(selection: SrsGroupSelection): Record<number, string> {
    const labels: Record<number, string> = {}

    const keys = Object.keys(selection) as Array<keyof SrsGroupSelection>
    keys.forEach((key) => {
      if (!selection[key]) {
        return
      }

      computeAllowedSrsStages({
        apprentice: key === "apprentice",
        guru: key === "guru",
        master: key === "master",
        enlightened: key === "enlightened",
        burned: key === "burned"
      } as SrsGroupSelection).forEach((stage) => {
        labels[stage] = key
      })
    })

    return labels
  }

  private addEntry(entry: VocabularyEntry): void {
    const uniqueEnglish = Array.from(
      new Set(entry.english.map((word) => word.trim()).filter(Boolean))
    )

    if (!uniqueEnglish.length) {
      return
    }

    const normalizedEntry: VocabularyEntry = {
      ...entry,
      english: uniqueEnglish
    }

    this.currentEntries.push(normalizedEntry)

    uniqueEnglish.forEach((word) => {
      const normalized = normalizeWord(word)
      this.trie.insert(normalized)

      const existing = this.lookupMap.get(normalized)
      if (!existing) {
        this.lookupMap.set(normalized, normalizedEntry)
        return
      }

      const resolved = this.resolveConflict(existing, normalizedEntry)
      this.lookupMap.set(normalized, resolved)
    })
  }

  private resolveConflict(
    existing: VocabularyEntry,
    candidate: VocabularyEntry
  ): VocabularyEntry {
    if (candidate.priority > existing.priority) {
      return candidate
    }

    if (candidate.priority < existing.priority) {
      return existing
    }

    const existingStage = existing.srsStage ?? -1
    const candidateStage = candidate.srsStage ?? -1

    if (candidateStage > existingStage) {
      return candidate
    }

    if (candidateStage < existingStage) {
      return existing
    }

    if ((candidate.reading?.length ?? 0) > (existing.reading?.length ?? 0)) {
      return candidate
    }

    return existing
  }
}

export const buildVocabulary = (dependencies: VocabularyBuildDependencies): BuildResult => {
  const manager = new VocabularyManager(dependencies)
  return manager.build()
}
