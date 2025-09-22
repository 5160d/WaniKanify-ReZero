import { t } from '~src/utils/i18n'
import { log } from '~src/utils/log'
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.max(ms, 0)))

export type WaniKaniSubject = {
  id: number
  object: "vocabulary" | string
  url: string
  data_updated_at: string
  data: {
    slug: string
    characters: string | null
    meanings: Array<{
      meaning: string
      primary: boolean
      accepted_answer: boolean
    }>
    readings?: Array<{
      reading: string
      primary: boolean
      accepted_answer: boolean
    }>
    document_url?: string
    auxiliary_meanings?: Array<{
      meaning: string
      type: string
    }>
    parts_of_speech?: string[]
    pronunciation_audios?: Array<{
      url: string
      content_type: string
      metadata: {
        gender: string
        voice_actor_id: number
        pronunciation: string
      }
    }>
    level?: number
  }
}

export type WaniKaniAssignment = {
  id: number
  object: "assignment"
  data: {
    subject_id: number
    subject_type: string
    srs_stage: number
    unlocked_at: string | null
    available_at: string | null
    passed_at: string | null
    burned_at: string | null
  }
}

export type PaginatedResponse<T> = {
  object: "collection"
  url: string
  data_updated_at: string
  data: T[]
  pages: {
    per_page: number
    next_url: string | null
    previous_url: string | null
  }
  total_count: number
}

export type WaniKaniClientOptions = {
  token?: string
  cacheTtlMs?: number
  minRequestIntervalMs?: number
}

export type CachedResponse<T> = {
  timestamp: number
  expiresAt: number
  value: T
}

export type SrsGroupSelection = {
  apprentice: boolean
  guru: boolean
  master: boolean
  enlightened: boolean
  burned: boolean
}

const SRS_STAGE_GROUPS: Record<keyof SrsGroupSelection, number[]> = {
  apprentice: [1, 2, 3, 4],
  guru: [5, 6],
  master: [7],
  enlightened: [8],
  burned: [9]
}

const API_BASE_URL = "https://api.wanikani.com/v2"
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 15
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 1200

const enum WaniKaniErrorCode {
  Unauthorized = 401,
  Forbidden = 403,
  TooManyRequests = 429,
  ServerError = 500
}

export class WaniKaniError extends Error {
  status: number
  retryAfter?: number

  constructor(message: string, status: number, retryAfter?: number) {
    super(message)
    this.name = "WaniKaniError"
    this.status = status
    this.retryAfter = retryAfter
  }
}

export class WaniKaniClient {
  private token: string = ""
  private cacheTtlMs: number
  private minRequestIntervalMs: number
  private cache = new Map<string, CachedResponse<unknown>>()
  private lastRequestAt = 0
  private pendingRequests = new Map<string, Promise<unknown>>()
  // Stores Last-Modified header values per cacheKey (persists beyond TTL expiry for conditional requests)
  private lastModified = new Map<string, string>()
  // Stores most recent successful response value (even past TTL) for 304 fallback
  private staleValues = new Map<string, unknown>()

  constructor(options: WaniKaniClientOptions = {}) {
    this.token = options.token?.trim() ?? ""
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS
    this.minRequestIntervalMs =
      options.minRequestIntervalMs ?? DEFAULT_MIN_REQUEST_INTERVAL_MS
  }

  setToken(token: string): void {
    const normalized = token?.trim() ?? ""
    if (normalized === this.token) {
      return
    }

    this.token = normalized
    this.clearCache()
  }

  clearCache(): void {
    this.cache.clear()
    // Also clear conditional metadata when cache cleared (e.g., token change)
    this.lastModified.clear()
    this.staleValues.clear()
  }

  hasToken(): boolean {
    return Boolean(this.token)
  }

  async fetchAllVocabularySubjects(params: Record<string, string | number | undefined> = {}): Promise<WaniKaniSubject[]> {
    return this.fetchPaginated<WaniKaniSubject>("subjects", {
      types: "vocabulary",
      ...params
    })
  }

  async fetchAssignments(params: Record<string, string | number | undefined> = {}): Promise<WaniKaniAssignment[]> {
    return this.fetchPaginated<WaniKaniAssignment>("assignments", params)
  }

  private async fetchPaginated<T>(endpoint: string, query: Record<string, string | number | undefined>): Promise<T[]> {
    const results: T[] = []

    let nextUrl: URL | null = this.buildUrl(endpoint, query)

    while (nextUrl) {
      const response = await this.request<PaginatedResponse<T>>(nextUrl, {
        cacheKey: `${endpoint}?${nextUrl.searchParams.toString()}`
      })

      results.push(...response.data)

      nextUrl = response.pages?.next_url ? new URL(response.pages.next_url) : null
    }

    return results
  }

  private buildUrl(endpoint: string, query: Record<string, string | number | undefined>): URL {
    const sanitisedEndpoint = endpoint.replace(/^\//, "")
    const url = new URL(`${API_BASE_URL}/${sanitisedEndpoint}`)

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return
      }
      url.searchParams.set(key, String(value))
    })

    return url
  }

  private async request<T>(url: URL, options: { cacheKey?: string } = {}): Promise<T> {
    const cacheKey = options.cacheKey ?? `${url.pathname}?${url.searchParams.toString()}`

    const cached = this.getFromCache<T>(cacheKey)
    if (cached) {
      return cached
    }

    if (!this.hasToken()) {
      throw new WaniKaniError(
        t('wanikani_error_missing_token'),
        WaniKaniErrorCode.Unauthorized
      )
    }

    const inflight = this.pendingRequests.get(cacheKey) as Promise<T> | undefined
    if (inflight) {
      return inflight
    }

    const requestPromise = this.performRequest<T>(url, cacheKey)
      .then((result) => {
        if (result.from304) {
          // 304: return stale value (should exist if conditional request used properly)
          return result.value as T
        }
        // 200: cache and record metadata
        this.setCache(cacheKey, result.value as T)
        if (result.lastModified) {
          this.lastModified.set(cacheKey, result.lastModified)
        }
        this.staleValues.set(cacheKey, result.value)
        return result.value as T
      })
      .finally(() => {
        this.pendingRequests.delete(cacheKey)
      })

    this.pendingRequests.set(cacheKey, requestPromise)

    return requestPromise
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CachedResponse<T> | undefined

    if (!entry) {
      return null
    }

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  private setCache<T>(key: string, value: T): void {
    const now = Date.now()
    this.cache.set(key, {
      timestamp: now,
      expiresAt: now + this.cacheTtlMs,
      value
    })
  }

  private async performRequest<T>(url: URL, cacheKey: string): Promise<{ value?: T; lastModified?: string; from304?: boolean }> {
    const elapsed = Date.now() - this.lastRequestAt
    if (elapsed < this.minRequestIntervalMs) {
      await wait(this.minRequestIntervalMs - elapsed)
    }

  // Determine if endpoint is eligible for conditional requests (assignments + subjects)
  const isAssignments = /\/assignments$/.test(url.pathname)
  const isSubjects = /\/subjects$/.test(url.pathname)
  const conditionalValue = (isAssignments || isSubjects) ? this.lastModified.get(cacheKey) : undefined

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json"
    }
    if (conditionalValue) {
      headers["If-Modified-Since"] = conditionalValue
    }

    const response = await fetch(url.toString(), { headers })

    this.lastRequestAt = Date.now()

    if (response.status === WaniKaniErrorCode.TooManyRequests) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 1
      await wait(retryAfter * 1000)
      return this.performRequest<T>(url, cacheKey)
    }

    if (response.status === 304) {
      // Special handling: for subjects + updated_after we want an empty delta, not a replay of stale full dataset.
      const hasUpdatedAfter = url.searchParams.has('updated_after')
      const isSubjects = /\/subjects$/.test(url.pathname)
      if (process.env.WK_DEBUG === '1' || process.env.WK_LIVE) {
        log.info('[wanikani-client] 304 Not Modified for', cacheKey, isSubjects && hasUpdatedAfter ? '(subjects incremental empty delta)' : '')
      }
      if (isSubjects && hasUpdatedAfter) {
        // Return an empty collection shape compatible with PaginatedResponse<T>
        const empty = {
          object: 'collection',
          url: url.toString(),
          data_updated_at: this.lastModified.get(cacheKey) || '',
          data: [],
          pages: { per_page: 500, next_url: null, previous_url: null },
          total_count: 0
        } as unknown as T
        return { value: empty, from304: true }
      }
      // Fallback: use stale full value
      const stale = this.staleValues.get(cacheKey)
      if (stale === undefined) {
        throw new WaniKaniError('Received 304 but no stale value cached', response.status)
      }
      return { value: stale as T, from304: true }
    }

    if (!response.ok) {
      const body = await response.text()
      let parsedMessage = body

      try {
        parsedMessage = JSON.parse(body)?.error ?? body
      } catch {
        // ignore json parse failure
      }

      throw new WaniKaniError(parsedMessage, response.status)
    }

    const json = (await response.json()) as T
    const lm = response.headers?.get?.("Last-Modified") || undefined
    return { value: json, lastModified: lm }
  }

  // ---- Last-Modified helpers (for persistence across extension restarts) ----
  /**
   * Retrieve Last-Modified value for baseline subjects or an incremental query.
   * Pass updated_after if the last fetch used incremental mode.
   */
  public getLastModifiedForSubjects(updated_after?: string): string | undefined {
    const url = this.buildUrl('subjects', { types: 'vocabulary', ...(updated_after ? { updated_after } : {}) })
    const cacheKey = `subjects?${url.searchParams.toString()}`
    return this.lastModified.get(cacheKey)
  }

  /** Retrieve Last-Modified value for assignments (vocabulary). */
  public getLastModifiedForAssignments(): string | undefined {
    const url = this.buildUrl('assignments', { subject_types: 'vocabulary' })
    const cacheKey = `assignments?${url.searchParams.toString()}`
    return this.lastModified.get(cacheKey)
  }

  /** Seed Last-Modified for baseline subjects query (no updated_after). */
  public seedLastModifiedForSubjects(value: string | undefined, updated_after?: string): void {
    if (!value) return
    const url = this.buildUrl('subjects', { types: 'vocabulary', ...(updated_after ? { updated_after } : {}) })
    const cacheKey = `subjects?${url.searchParams.toString()}`
    this.lastModified.set(cacheKey, value)
  }

  /** Seed Last-Modified for assignments (vocabulary) query. */
  public seedLastModifiedForAssignments(value: string | undefined): void {
    if (!value) return
    const url = this.buildUrl('assignments', { subject_types: 'vocabulary' })
    const cacheKey = `assignments?${url.searchParams.toString()}`
    this.lastModified.set(cacheKey, value)
  }

  /** Seed baseline subjects dataset (vocabulary only) with Last-Modified and stale value for 304 reuse after restart. */
  public seedBaselineSubjects(subjects: WaniKaniSubject[] | undefined, lastModified?: string): void {
    if (!subjects) return
    const url = this.buildUrl('subjects', { types: 'vocabulary' })
    const cacheKey = `subjects?${url.searchParams.toString()}`
    if (lastModified) this.lastModified.set(cacheKey, lastModified)
    // Build a minimal PaginatedResponse shape for stale re-use
    const value = {
      object: 'collection',
      url: url.toString(),
      data_updated_at: subjects.reduce((max, s) => (s.data_updated_at > max ? s.data_updated_at : max), subjects[0]?.data_updated_at || ''),
      data: subjects,
      pages: { per_page: subjects.length, next_url: null, previous_url: null },
      total_count: subjects.length
    }
    this.staleValues.set(cacheKey, value)
  }

  /** Seed baseline assignments dataset with Last-Modified and stale value for 304 reuse after restart. */
  public seedBaselineAssignments(assignments: WaniKaniAssignment[] | undefined, lastModified?: string): void {
    if (!assignments) return
    const url = this.buildUrl('assignments', { subject_types: 'vocabulary' })
    const cacheKey = `assignments?${url.searchParams.toString()}`
    if (lastModified) this.lastModified.set(cacheKey, lastModified)
    const value = {
      object: 'collection',
      url: url.toString(),
      data_updated_at: new Date().toISOString(),
      data: assignments,
      pages: { per_page: assignments.length, next_url: null, previous_url: null },
      total_count: assignments.length
    }
    this.staleValues.set(cacheKey, value)
  }
}

export const createWaniKaniClient = (options: WaniKaniClientOptions = {}) =>
  new WaniKaniClient(options)

export const computeAllowedSrsStages = (
  selection: SrsGroupSelection
): Set<number> => {
  const stages = new Set() as Set<number>

  (Object.keys(SRS_STAGE_GROUPS) as Array<keyof SrsGroupSelection>).forEach(
    (group) => {
      if (!selection?.[group]) {
        return
      }

      SRS_STAGE_GROUPS[group].forEach((stage) => stages.add(stage))
    }
  )

  return stages
}

export const filterAssignmentsBySrsSelection = (
  assignments: WaniKaniAssignment[],
  selection: SrsGroupSelection
): WaniKaniAssignment[] => {
  const allowedStages = computeAllowedSrsStages(selection)

  if (!allowedStages.size) {
    return []
  }

  return assignments.filter((assignment) =>
    allowedStages.has(assignment.data.srs_stage)
  )
}

export const getSelectedSubjectIds = (
  assignments: WaniKaniAssignment[],
  selection: SrsGroupSelection
): Set<number> => {
  const filteredAssignments = filterAssignmentsBySrsSelection(
    assignments,
    selection
  )

  return new Set(filteredAssignments.map((assignment) => assignment.data.subject_id))
}
