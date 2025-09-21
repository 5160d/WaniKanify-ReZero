import type { WaniKaniAssignment, WaniKaniSubject } from "~src/services/wanikani"

export type VocabularySource = "wanikani" | "custom" | "imported"

export interface VocabularyEntry {
  id: string
  english: string[]
  japanese: string
  reading?: string
  source: VocabularySource
  priority: number
  srsStage?: number
  srsLevelLabel?: string
  wanikaniSubjectId?: number
  audioUrls?: string[]
}

export type VocabularyCachePayload = {
  updatedAt: string
  expiresAt: string
  wanikaniSubjects: WaniKaniSubject[]
  assignments: WaniKaniAssignment[]
  vocabularyEntries: VocabularyEntry[]
  error?: string
}
