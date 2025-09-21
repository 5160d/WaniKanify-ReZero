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
  // Highest data_updated_at among wanikaniSubjects at time of caching.
  lastSubjectsUpdatedAt?: string
  // Last-Modified header values captured during last successful fetch cycle
  lastModifiedSubjects?: string
  lastModifiedAssignments?: string
  error?: string
}
