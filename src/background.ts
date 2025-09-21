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

const structuredCloneSafe = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

type BackgroundMessage =
  | { type: "wanikanify:get-state" }
  | { type: "wanikanify:get-settings" }
  | { type: "wanikanify:refresh-vocabulary"; payload?: { force?: boolean } }
  | { type: "wanikanify:performance"; payload: { processedNodes: number; averageMs: number; longestMs?: number } }
  | { type: "wanikanify:refresh-imported-vocabulary" }
  | { type: "wanikanify:clear-cache" }

type BackgroundResponse =
  | { type: "wanikanify:state"; payload: ExtensionState }
  | { type: "wanikanify:settings"; payload: WaniSettings }
  | { type: "wanikanify:refresh-started" }
  | { type: "wanikanify:error"; error: string }

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
const VOCABULARY_REFRESH_ALARM = "wanikanify:vocabulary-refresh"
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
      namespace: 'wanikanify-vocabulary'
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
          type: "wanikanify:settings",
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
          type: "wanikanify:state",
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
            type: "wanikanify:error",
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
    if (isCacheValid(this.vocabularyCache)) {
      return
    }

    if (!this.settings.apiToken) {
      return
    }

    await this.refreshVocabulary(true)
  }

  private async handleMessage(message: BackgroundMessage): Promise<BackgroundResponse | void> {
    switch (message.type) {
      case "wanikanify:get-state":
        return {
          type: "wanikanify:state",
          payload: this.buildState()
        }

      case "wanikanify:get-settings":
        return {
          type: "wanikanify:settings",
          payload: this.settings
        }

      case "wanikanify:refresh-imported-vocabulary":
        await this.loadImportedVocabulary()
        await this.recalculateVocabularyEntriesFromCache()
        return { type: "wanikanify:state", payload: this.buildState() }
      case "wanikanify:refresh-vocabulary":
        if (this.isRefreshing) {
          return { type: "wanikanify:refresh-started" }
        }

        void this.refreshVocabulary(Boolean(message.payload?.force))

        return { type: "wanikanify:refresh-started" }
      case "wanikanify:clear-cache":
        await this.clearVocabularyCache()
        return { type: 'wanikanify:state', payload: this.buildState() }
      case "wanikanify:performance":
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

        this.broadcast({ type: "wanikanify:state", payload: this.buildState() })
        return
    }
  }

  private async refreshVocabulary(force = false): Promise<VocabularyCachePayload | null> {
    if (!this.settings.apiToken) {
      return null
    }

    if (!force && isCacheValid(this.vocabularyCache)) {
      return this.vocabularyCache
    }

    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performVocabularyRefresh()
      .catch((error) => {
        console.error("WaniKanify: vocabulary refresh failed", error)
        throw error
      })
      .finally(() => {
        this.refreshPromise = null
      })

    return this.refreshPromise
  }

  private async performVocabularyRefresh(): Promise<VocabularyCachePayload | null> {
    this.isRefreshing = true
    this.broadcast({ type: "wanikanify:state", payload: this.buildState() })

    try {
      this.client.setToken(this.settings.apiToken ?? "")

      const [subjects, assignments] = await Promise.all([
        this.fetchVocabularySubjects(),
        this.fetchAssignments()
      ])

      this.vocabularyManager.updateSettings(this.settings)
      this.vocabularyManager.updateWaniKaniData(subjects, assignments)
      const cache: VocabularyCachePayload = {
        updatedAt: nowIso(),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
        wanikaniSubjects: subjects,
        assignments,
        vocabularyEntries: this.vocabularyManager
          .build()
          .entries
      }

      this.vocabularyCache = cache
      await this.vocabularyStorage.saveCompressed(VOCABULARY_STORAGE_KEY, cache, 1)
      this.broadcast({ type: "wanikanify:state", payload: this.buildState() })
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

      this.broadcast({ type: "wanikanify:state", payload: this.buildState() })

      return null
    } finally {
      this.isRefreshing = false
      this.broadcast({ type: "wanikanify:state", payload: this.buildState() })
    }
  }

  private async fetchVocabularySubjects(): Promise<WaniKaniSubject[]> {
    try {
      return await this.client.fetchAllVocabularySubjects()
    } catch (error) {
      throw error
    }
  }

  private async fetchAssignments(): Promise<WaniKaniAssignment[]> {
    try {
      return await this.client.fetchAssignments({ subject_types: "vocabulary" })
    } catch (error) {
      if (error instanceof WaniKaniError && error.status === 403) {
        console.warn("WaniKanify: assignments access denied, continuing without SRS data")
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
          log.debug("WaniKanify: broadcast message failed", message)
        }
      })
    } catch (error) {
      if (isDev) {
  log.debug("WaniKanify: failed to dispatch broadcast", error)
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
          vocabularyEntries: result.entries,
          updatedAt: nowIso()
        }
      : {
          updatedAt: nowIso(),
          expiresAt: nowIso(),
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
    this.broadcast({ type: "wanikanify:state", payload: this.buildState() })
  }

  private async clearVocabularyCache(): Promise<void> {
    this.vocabularyCache = null
    await this.vocabularyStorage.remove(VOCABULARY_STORAGE_KEY)
    // Attempt to remove any lingering sync key
    try { chrome.storage.sync?.remove?.(VOCABULARY_STORAGE_KEY) } catch (_) { /* ignore */ }
    this.broadcast({ type: 'wanikanify:state', payload: this.buildState() })
  }

  private scheduleRefreshAlarm(): void {
    if (!chrome?.alarms?.create) {
      console.warn("WaniKanify: alarms API unavailable, skipping refresh scheduling")
      return
    }

    chrome.alarms.create(VOCABULARY_REFRESH_ALARM, {
      periodInMinutes: DEFAULT_REFRESH_INTERVAL_MINUTES,
      delayInMinutes: 1
    })
  }

  private onInstall(): void {
    console.info("WaniKanify: extension installed")
    this.scheduleRefreshAlarm()
  }

  private onUpdate(): void {
    console.info("WaniKanify: extension updated")
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
  log.debug("WaniKanify: unable to update action popup", error)
    }
  }

  hasValidToken(): boolean {
    return Boolean(this.settings.apiToken)
  }
}

const controller = new BackgroundController()

controller
  .init()
  .catch((error) => console.error("WaniKanify: background init failed", error))

chrome.action.onClicked.addListener(async (tab) => {
  if (!controller.hasValidToken()) {
    chrome.runtime.openOptionsPage()
    return
  }

  if (!tab?.id) {
    return
  }

  chrome.tabs.sendMessage(tab.id, { type: "wanikanify:toggle-runtime" }, (response) => {
    if (chrome.runtime.lastError) {
      return
    }

    return response
  })
})

export {}




