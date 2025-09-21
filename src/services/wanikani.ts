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
        "Missing WaniKani API token",
        WaniKaniErrorCode.Unauthorized
      )
    }

    const inflight = this.pendingRequests.get(cacheKey) as Promise<T> | undefined
    if (inflight) {
      return inflight
    }

    const requestPromise = this.performRequest<T>(url)
      .then((data) => {
        this.setCache(cacheKey, data)
        return data
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

  private async performRequest<T>(url: URL): Promise<T> {
    const elapsed = Date.now() - this.lastRequestAt
    if (elapsed < this.minRequestIntervalMs) {
      await wait(this.minRequestIntervalMs - elapsed)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      }
    })

    this.lastRequestAt = Date.now()

    if (response.status === WaniKaniErrorCode.TooManyRequests) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 1
      await wait(retryAfter * 1000)
      return this.performRequest<T>(url)
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

    return (await response.json()) as T
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
