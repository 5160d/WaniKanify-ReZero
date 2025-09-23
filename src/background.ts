import { Storage } from "@plasmohq/storage"

import { githubUrl, isDev } from "~src/components/common/constants"
import { DEFAULT_SETTINGS } from "~src/components/settings/constants"
import type { AudioMode } from "~src/components/settings/toggles/types"
import type { WaniSettings } from "~src/components/settings/types"
import {
  waniSettingsDeserializer,
  waniSettingsSerializer
} from "~src/components/settings/types"
import {
  createWaniKaniClient,
  type WaniKaniAssignment,
  type WaniKaniSubject,
  WaniKaniClient,
  WaniKaniError
} from "~src/services/wanikani"
import { VocabularyManager } from "~src/services/vocabulary"
import type { VocabularyCachePayload } from "~src/services/vocabulary/types"
import {
  getAggregatedImportedVocabulary,
  SPREADSHEET_DATA_STORAGE_KEY
} from "~src/services/spreadsheetImport"
import { ExtensionStorageService } from "~src/services/storage"
import { log } from '~src/utils/log'
import { computeMaxUpdatedAt } from '~src/services/wanikani/computeMaxUpdatedAt'
import {
  __WK_EVT_GET_STATE,
  __WK_EVT_GET_SETTINGS,
  __WK_EVT_REFRESH_VOCAB,
  __WK_EVT_REFRESH_IMPORTED_VOCAB,
  __WK_EVT_REFRESH_STARTED,
  __WK_EVT_CLEAR_CACHE,
  __WK_EVT_PERFORMANCE,
  __WK_EVT_STATE,
  __WK_EVT_SETTINGS,
  __WK_EVT_ERROR,
  __WK_EVT_TOGGLE_RUNTIME,
  __WK_ALARM_VOCAB_REFRESH,
  __WK_NS_VOCABULARY
} from '~src/internal/tokens'

const structuredCloneSafe = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

// Updated message / response types using sentinel constants
// (Keeps strong string literal typing referencing a single source of truth.)
type BackgroundMessage =
  | { type: typeof __WK_EVT_GET_STATE }
  | { type: typeof __WK_EVT_GET_SETTINGS }
  | { type: typeof __WK_EVT_REFRESH_VOCAB; payload?: { force?: boolean } }
  | { type: typeof __WK_EVT_PERFORMANCE; payload: { processedNodes: number; averageMs: number; longestMs?: number } }
  | { type: typeof __WK_EVT_REFRESH_IMPORTED_VOCAB }
  | { type: typeof __WK_EVT_CLEAR_CACHE }

type BackgroundResponse =
  | { type: typeof __WK_EVT_STATE; payload: ExtensionState }
  | { type: typeof __WK_EVT_SETTINGS; payload: WaniSettings }
  | { type: typeof __WK_EVT_REFRESH_STARTED }
  | { type: typeof __WK_EVT_ERROR; error: string }

 type ExtensionState = {
  settings: WaniSettings
  vocabulary: VocabularyCachePayload | null
  isRefreshing: boolean
  performance?: {
    processedNodes: number
    averageMs: number
    longestMs: number
  }
}

const SETTINGS_STORAGE_KEY = "WaniSettings"
const VOCABULARY_STORAGE_KEY = "WaniVocabularyCache"
const VOCABULARY_REFRESH_ALARM = __WK_ALARM_VOCAB_REFRESH
const DEFAULT_REFRESH_INTERVAL_MINUTES = 60 * 6
const CACHE_TTL_MS = 1000 * 60 * 60 * 6

const nowIso = () => new Date().toISOString()

const isValidAudioMode = (mode: unknown): mode is AudioMode =>
  mode === "click" || mode === "hover"

const normalizeAudioMode = (mode: unknown): AudioMode =>
  isValidAudioMode(mode) ? mode : "click"

const isCacheValid = (cache: VocabularyCachePayload | null) => {
  if (!cache) {
    return false
  }

  if (!cache.expiresAt) {
    return false
  }

  return Date.now() < new Date(cache.expiresAt).getTime()
}

class BackgroundController {
  private storage = new Storage({
    area: isDev ? "local" : "sync",
    serde: {
      serializer: (value) => JSON.stringify(value, waniSettingsSerializer),
      deserializer: (text) =>
        text ? JSON.parse(text, waniSettingsDeserializer) : text
    }
  })

  private client: WaniKaniClient = createWaniKaniClient()

  private settings: WaniSettings = this.cloneDefaultSettings()

  private vocabularyManager = new VocabularyManager({
    settings: this.cloneDefaultSettings(),
    subjects: [],
    assignments: []
  })

  private vocabularyStorage = (() => {
    // Store vocabulary cache only in local storage to avoid sync quota pressure.
    const service = new ExtensionStorageService<VocabularyCachePayload>({
      area: 'local',
      quotaBytes: 5_242_880,
      namespace: __WK_NS_VOCABULARY
    })

    service.registerMigration({
      version: 2,
      migrate: (data) => ({
        ...data,
        wanikaniSubjects: data?.wanikaniSubjects ?? [],
        assignments: data?.assignments ?? [],
        vocabularyEntries: data?.vocabularyEntries ?? []
      })
    })

    return service
  })()

  private vocabularyCache: VocabularyCachePayload | null = null

  private refreshPromise: Promise<VocabularyCachePayload | null> | null = null

  private isRefreshing = false

  private performanceMetrics = {
    processedNodes: 0,
    averageMs: 0,
    longestMs: 0
  }

  private lastVocabularyRefreshAt: number | null = null
  private refreshWatchdogIds = new Set<ReturnType<typeof setTimeout>>()

  private async loadImportedVocabulary(): Promise<void> {
    const imported = await getAggregatedImportedVocabulary()
    this.vocabularyManager.updateImportedVocabulary(imported)
  }

  async init(): Promise<void> {
    await this.loadInitialState()
    this.registerListeners()
    await this.ensureInitialVocabulary()
  }

  private cloneDefaultSettings(): WaniSettings {
    const base = DEFAULT_SETTINGS
    const clone: WaniSettings = {
      version: base.version,
      apiToken: base.apiToken,
      autoRun: base.autoRun,
      audio: structuredCloneSafe(base.audio),
      showReplacementTooltips: base.showReplacementTooltips,
      numbersReplacement: base.numbersReplacement,
      performanceTelemetry: base.performanceTelemetry,
      srsGroups: structuredCloneSafe(base.srsGroups),
      customVocabulary: new Map(base.customVocabulary),
      vocabularyBlacklist: new Set(base.vocabularyBlacklist),
      sitesFiltering: [...base.sitesFiltering],
      spreadsheetImport: structuredCloneSafe(base.spreadsheetImport),
      siteOverrides: structuredCloneSafe(base.siteOverrides ?? {})
    }

    this.sanitizeSettings(clone)
    return clone
  }

  private async loadInitialState(): Promise<void> {
    const [storedSettings, compressedVocabulary] = await Promise.all([
      this.storage.get<WaniSettings>(SETTINGS_STORAGE_KEY),
      this.vocabularyStorage.loadCompressed(VOCABULARY_STORAGE_KEY)
    ])

    let cachedVocabulary = compressedVocabulary?.data


    if (storedSettings) {
      this.settings = storedSettings
      this.sanitizeSettings(this.settings)
      this.vocabularyManager.updateSettings(this.settings)
    }

    this.client.setToken(this.settings.apiToken ?? "")
    this.updateActionBehavior(this.settings)

    if (cachedVocabulary) {
      this.vocabularyCache = cachedVocabulary
      this.vocabularyManager.updateWaniKaniData(
        cachedVocabulary.wanikaniSubjects ?? [],
        cachedVocabulary.assignments ?? []
      )
      // Seed Last-Modified conditional metadata so first refresh after restart can leverage 304s.
      try {
        if (cachedVocabulary.wanikaniSubjects?.length) {
          this.client.seedBaselineSubjects(cachedVocabulary.wanikaniSubjects, cachedVocabulary.lastModifiedSubjects)
        } else if (cachedVocabulary.lastModifiedSubjects) {
          this.client.seedLastModifiedForSubjects(cachedVocabulary.lastModifiedSubjects)
        }
        if (cachedVocabulary.assignments?.length) {
          this.client.seedBaselineAssignments(cachedVocabulary.assignments, cachedVocabulary.lastModifiedAssignments)
        } else if (cachedVocabulary.lastModifiedAssignments) {
          this.client.seedLastModifiedForAssignments(cachedVocabulary.lastModifiedAssignments)
        }
  } catch { /* non-fatal */ }
    } else {
      this.vocabularyCache = null
    }

    await this.loadImportedVocabulary()

    this.scheduleRefreshAlarm()
  }

  private registerListeners(): void {
    chrome.runtime.onInstalled.addListener(({ reason }) => {
      if (reason === "install") {
        this.onInstall()
      }

      if (reason === "update") {
        this.onUpdate()
      }
    })

    chrome.runtime.onStartup.addListener(() => {
      this.scheduleRefreshAlarm()
    })

    chrome.runtime.setUninstallURL?.(`${githubUrl}?ref=wanikanify-extension`)

    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      const settingsArea = isDev ? "local" : "sync"

      if (areaName === settingsArea && changes?.[SETTINGS_STORAGE_KEY]) {
        const newValue = (await this.storage.get<WaniSettings>(
          SETTINGS_STORAGE_KEY
        )) ?? this.cloneDefaultSettings()

        this.settings = newValue
        this.sanitizeSettings(this.settings)
        this.client.setToken(newValue.apiToken ?? "")
        this.vocabularyManager.updateSettings(this.settings)
        this.updateActionBehavior(this.settings)

        this.broadcast({
          type: __WK_EVT_SETTINGS,
          payload: this.settings
        })

        if (newValue.apiToken && newValue.apiToken !== changes[SETTINGS_STORAGE_KEY].oldValue?.apiToken) {
          void this.refreshVocabulary(true)
        } else {
          await this.recalculateVocabularyEntriesFromCache()
        }
      }

      if (areaName === settingsArea && changes?.[VOCABULARY_STORAGE_KEY]) {
        const newCache = await this.storage.get<VocabularyCachePayload>(
          VOCABULARY_STORAGE_KEY
        )

        this.vocabularyCache = newCache ?? null
        this.broadcast({
          type: __WK_EVT_STATE,
          payload: this.buildState()
        })
      }

      if (areaName === "local" && changes?.[SPREADSHEET_DATA_STORAGE_KEY]) {
        await this.loadImportedVocabulary()
        await this.recalculateVocabularyEntriesFromCache()
      }
    })

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === VOCABULARY_REFRESH_ALARM) {
        void this.refreshVocabulary()
      }
    })

    chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
      if (!message || typeof message !== "object" || !("type" in message)) {
        return
      }

      this.handleMessage(message)
        .then((response) => {
          if (response) {
            sendResponse(response)
          }
        })
        .catch((error) => {
          sendResponse({
            type: __WK_EVT_ERROR,
            error: error instanceof Error ? error.message : String(error)
          })
        })

      return true
    })
  }

  private buildState(): ExtensionState {
    return {
      settings: this.settings,
      vocabulary: this.vocabularyCache,
      isRefreshing: this.isRefreshing,
      performance: { ...this.performanceMetrics }
    }
  }

  private async ensureInitialVocabulary(): Promise<void> {
    if (!this.settings.apiToken) {
      return
    }
    
    if (isCacheValid(this.vocabularyCache)) {
      return
    }

    await this.refreshVocabulary(true)
  }

  private async handleMessage(message: BackgroundMessage): Promise<BackgroundResponse | void> {
    switch (message.type) {
      case __WK_EVT_GET_STATE:
        return {
          type: __WK_EVT_STATE,
          payload: this.buildState()
        }

      case __WK_EVT_GET_SETTINGS:
        return {
          type: __WK_EVT_SETTINGS,
          payload: this.settings
        }

      case __WK_EVT_REFRESH_IMPORTED_VOCAB:
        await this.loadImportedVocabulary()
        await this.recalculateVocabularyEntriesFromCache()
        return { type: __WK_EVT_STATE, payload: this.buildState() }
      case __WK_EVT_REFRESH_VOCAB:
        if (this.isRefreshing) {
          return { type: __WK_EVT_REFRESH_STARTED }
        }

        void this.refreshVocabulary(Boolean(message.payload?.force))

        return { type: __WK_EVT_REFRESH_STARTED }
      case __WK_EVT_CLEAR_CACHE:
        {
          // Clear existing cache then (throttled) kick off a forced refresh so the
          // UI repopulates instead of appearing empty until the next manual or alarm trigger.
          await this.clearVocabularyCache(true)
          const now = Date.now()
          const MIN_INTERVAL_MS = 5_000 // throttle forced refresh to once every 5s
          if (!this.lastVocabularyRefreshAt || now - this.lastVocabularyRefreshAt > MIN_INTERVAL_MS) {
            this.lastVocabularyRefreshAt = now
            // Force a full baseline rebuild even if we have an in-memory cache (we retained it
            // to keep replacements working during rebuild). Passing the baseline flag ensures we
            // don't attempt an incremental merge against stale data that has been logically cleared.
            void this.refreshVocabulary(true, { forceFullBaseline: true })
          }
          return { type: __WK_EVT_STATE, payload: this.buildState() }
        }
      case __WK_EVT_PERFORMANCE:
        if (!this.settings.performanceTelemetry || !message.payload) {
          return
        }

        this.performanceMetrics = {
          processedNodes: message.payload.processedNodes,
          averageMs: message.payload.averageMs,
          longestMs: Math.max(
          message.payload.longestMs ?? 0,
          this.performanceMetrics.longestMs
        )
        }

        this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })
        return
    }
  }

  private async refreshVocabulary(force = false, opts: { forceFullBaseline?: boolean } = {}): Promise<VocabularyCachePayload | null> {
    if (!this.settings.apiToken) {
      return null
    }

    if (!force && isCacheValid(this.vocabularyCache)) {
      return this.vocabularyCache
    }

    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performVocabularyRefresh(opts.forceFullBaseline === true)
      .catch((error) => {
  log.error('vocabulary refresh failed', error)
        throw error
      })
      .finally(() => {
        this.refreshPromise = null
      })

    // Watchdog: ensure we never stay stuck in isRefreshing state indefinitely (e.g. hung fetch)
    const currentPromise = this.refreshPromise
    const watchdogId = setTimeout(() => {
      if (this.refreshPromise === currentPromise && this.isRefreshing) {
        log.warn('vocabulary refresh watchdog triggered; resetting state')
        this.isRefreshing = false
        this.refreshPromise = null
        this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })
      }
      this.refreshWatchdogIds.delete(watchdogId)
    }, 30_000)
    this.refreshWatchdogIds.add(watchdogId)

    // Ensure watchdog cleared on natural completion
    this.refreshPromise.finally(() => {
      clearTimeout(watchdogId)
      this.refreshWatchdogIds.delete(watchdogId)
    })

    return this.refreshPromise
  }

  private async performVocabularyRefresh(forceFullBaseline: boolean): Promise<VocabularyCachePayload | null> {
    this.isRefreshing = true
    this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })

    try {
      this.client.setToken(this.settings.apiToken ?? "")
  // Decide whether to perform full or incremental subject fetch. When a cache clear occurs we
  // retain the existing in-memory vocabulary so that page replacements still function, but we
  // intentionally force a full baseline rebuild to avoid merging against possibly stale data.
  const canIncremental = !forceFullBaseline && Boolean(this.vocabularyCache?.wanikaniSubjects?.length) && !this.vocabularyCache?.error
      let subjects: WaniKaniSubject[] = []
      let incremental = false
      let lastSubjectsUpdatedAt = this.vocabularyCache?.lastSubjectsUpdatedAt

      if (!canIncremental) {
        // Full fetch baseline
        subjects = await this.fetchVocabularySubjects()
        lastSubjectsUpdatedAt = computeMaxUpdatedAt(subjects)
      } else {
        // Use stored timestamp or derive from cached subjects if absent
        const baselineTimestamp = lastSubjectsUpdatedAt || computeMaxUpdatedAt(this.vocabularyCache!.wanikaniSubjects)
        const updatedSubjects = await this.fetchVocabularySubjects({ updated_after: baselineTimestamp })
        if (updatedSubjects.length === 0) {
          subjects = this.vocabularyCache!.wanikaniSubjects
          lastSubjectsUpdatedAt = baselineTimestamp
        } else {
          incremental = true
          // Merge by id (replace on conflict)
          const map = new Map<number, WaniKaniSubject>()
          this.vocabularyCache!.wanikaniSubjects.forEach((s) => map.set(s.id, s))
            
          updatedSubjects.forEach((s) => map.set(s.id, s))
          subjects = Array.from(map.values())
          const newlyUpdatedMax = computeMaxUpdatedAt(updatedSubjects)
          if (!baselineTimestamp) {
            lastSubjectsUpdatedAt = newlyUpdatedMax
          } else if (!newlyUpdatedMax) {
            lastSubjectsUpdatedAt = baselineTimestamp
          } else {
            const prevMillis = Date.parse(baselineTimestamp)
            const newMillis = Date.parse(newlyUpdatedMax)
            if (newMillis > prevMillis) {
              lastSubjectsUpdatedAt = newlyUpdatedMax
            } else if (newMillis < prevMillis) {
              lastSubjectsUpdatedAt = baselineTimestamp
            } else {
              // Same millisecond; keep lexicographically larger (likely higher fractional precision)
              lastSubjectsUpdatedAt = newlyUpdatedMax > baselineTimestamp ? newlyUpdatedMax : baselineTimestamp
            }
          }
        }
      }

      // Always fetch assignments fully (no updated_after supported), we may optimize later.
      const assignments = await this.fetchAssignments()

  // Capture Last-Modified metadata for persistence.
  const lastModifiedSubjects = this.client.getLastModifiedForSubjects(incremental ? lastSubjectsUpdatedAt : undefined) || this.client.getLastModifiedForSubjects()
  const lastModifiedAssignments = this.client.getLastModifiedForAssignments()

      this.vocabularyManager.updateSettings(this.settings)
      this.vocabularyManager.updateWaniKaniData(subjects, assignments)
      const cache: VocabularyCachePayload = {
        updatedAt: nowIso(),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
        wanikaniSubjects: subjects,
        assignments,
        vocabularyEntries: this.vocabularyManager
          .build()
          .entries,
        lastSubjectsUpdatedAt,
        lastModifiedSubjects,
        lastModifiedAssignments
      }

      this.vocabularyCache = cache
      await this.vocabularyStorage.saveCompressed(VOCABULARY_STORAGE_KEY, cache, 1)
      this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })
      return cache
    } catch (error) {
      const errorMessage =
        error instanceof WaniKaniError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error)

      const cache: VocabularyCachePayload = {
        updatedAt: nowIso(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        wanikaniSubjects: [],
        assignments: [],
        vocabularyEntries: [],
        error: errorMessage
      }

      this.vocabularyCache = cache
      await this.vocabularyStorage.saveCompressed(VOCABULARY_STORAGE_KEY, cache, 1)

      this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })

      return null
    } finally {
      this.isRefreshing = false
      this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })
    }
  }

  private async fetchVocabularySubjects(params: Record<string, string | undefined> = {}): Promise<WaniKaniSubject[]> {
    return this.client.fetchAllVocabularySubjects(params)
  }

  private async fetchAssignments(): Promise<WaniKaniAssignment[]> {
    try {
      return await this.client.fetchAssignments({ subject_types: "vocabulary" })
    } catch (error) {
      if (error instanceof WaniKaniError && error.status === 403) {
  log.warn('assignments access denied, continuing without SRS data')
        return []
      }
      throw error
    }
  }

  private broadcast(response: BackgroundResponse): void {
    if (!chrome?.runtime?.sendMessage) {
      return
    }

    try {
      chrome.runtime.sendMessage(response, () => {
        const error = chrome.runtime.lastError

        if (!error) {
          return
        }

        const message = error.message ?? ""
        const isNoReceiver = message.includes("Receiving end does not exist")

        if (!isNoReceiver && isDev) {
          log.debug('broadcast message failed', message)
        }
      })
    } catch (error) {
      if (isDev) {
  log.debug('failed to dispatch broadcast', error)
      }
    }
  }

  private async recalculateVocabularyEntriesFromCache(): Promise<void> {
    this.vocabularyManager.updateSettings(this.settings)
    if (this.vocabularyCache) {
      this.vocabularyManager.updateWaniKaniData(
        this.vocabularyCache.wanikaniSubjects ?? [],
        this.vocabularyCache.assignments ?? []
      )
    } else {
      this.vocabularyManager.updateWaniKaniData([], [])
    }

    const result = this.vocabularyManager.build()

    const nextCache: VocabularyCachePayload = this.vocabularyCache
      ? {
          ...this.vocabularyCache,
          vocabularyEntries: result.entries
        }
      : {
          updatedAt: nowIso(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          wanikaniSubjects: [],
          assignments: [],
          vocabularyEntries: result.entries
        }

    this.vocabularyCache = nextCache
    await this.vocabularyStorage.saveCompressed(
      VOCABULARY_STORAGE_KEY,
      nextCache,
      1
    )
    this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })
  }

  private async clearVocabularyCache(retainInMemoryUntilRebuild = false): Promise<void> {
    // If retaining, do not null out in-memory cache so pages keep operating until rebuild completes.
    if (!retainInMemoryUntilRebuild) {
      this.vocabularyCache = null
    } else if (this.vocabularyCache) {
      // Mark existing cache as expired so any non-forced refresh logic still treats it as stale.
      try {
        this.vocabularyCache.expiresAt = new Date(Date.now() - 1000).toISOString()
      } catch { /* ignore */ }
    }
    await this.vocabularyStorage.remove(VOCABULARY_STORAGE_KEY)
    // Attempt to remove any lingering sync key
  try { chrome.storage.sync?.remove?.(VOCABULARY_STORAGE_KEY) } catch { /* ignore */ }
    // Also clear WaniKani client conditional metadata so that a forced refresh
    // after clearing does not rely on stale Last-Modified headers.
    this.client.clearConditionalMetadata?.()
    this.broadcast({ type: __WK_EVT_STATE, payload: this.buildState() })
  }

  private scheduleRefreshAlarm(): void {
    if (!chrome?.alarms?.create) {
  log.warn('alarms API unavailable, skipping refresh scheduling')
      return
    }

    chrome.alarms.create(VOCABULARY_REFRESH_ALARM, {
      periodInMinutes: DEFAULT_REFRESH_INTERVAL_MINUTES,
      delayInMinutes: 1
    })
  }

  private onInstall(): void {
  log.info('extension installed')
    this.scheduleRefreshAlarm()
  }

  private onUpdate(): void {
  log.info('extension updated')
    this.scheduleRefreshAlarm()
  }

  private sanitizeSettings(settings: WaniSettings): void {
    if (!settings.audio) {
      settings.audio = structuredCloneSafe(DEFAULT_SETTINGS.audio)
    }

    settings.audio.mode = normalizeAudioMode(settings.audio.mode)

    if (typeof settings.performanceTelemetry !== "boolean") {
      settings.performanceTelemetry = DEFAULT_SETTINGS.performanceTelemetry
    }

    if (typeof settings.showReplacementTooltips !== "boolean") {
      settings.showReplacementTooltips = DEFAULT_SETTINGS.showReplacementTooltips
    }

    if (!settings.siteOverrides) {
      return
    }

    Object.values(settings.siteOverrides).forEach((override) => {
      if (!override?.audio) {
        if (typeof override?.showReplacementTooltips !== "boolean") {
          delete override?.showReplacementTooltips
        }
        return
      }

      override.audio.mode = normalizeAudioMode(override.audio.mode)

      if (typeof override.showReplacementTooltips !== "boolean") {
        delete override.showReplacementTooltips
      }
    })
  }

  private updateActionBehavior(settings: WaniSettings): void {
    try {
      chrome.action.setPopup({ popup: settings.apiToken ? "" : "popup.html" })
    } catch (error) {
  log.debug('unable to update action popup', error)
    }
  }

  hasValidToken(): boolean {
    return Boolean(this.settings.apiToken)
  }

  // Test helper (non-production usage ok while extension not live)
  public __getVocabularyCacheForTest(): VocabularyCachePayload | null {
    // Expose internal cache only when running under test or non-production builds.
    // In production builds this returns null to avoid leaking internal state.
    const env = (process.env.NODE_ENV || 'production').toLowerCase()
    if (env === 'test' || env === 'development') {
      return this.vocabularyCache
    }
    return null
  }
}

const controller = new BackgroundController()

controller
  .init()
  .catch((error) => log.error('background init failed', error))

chrome.action.onClicked.addListener(async (tab) => {
  if (!controller.hasValidToken()) {
    chrome.runtime.openOptionsPage()
    return
  }

  if (!tab?.id) {
    return
  }

  chrome.tabs.sendMessage(tab.id, { type: __WK_EVT_TOGGLE_RUNTIME }, (response) => {
    if (chrome.runtime.lastError) {
      return
    }

    return response
  })
})

export { controller }




