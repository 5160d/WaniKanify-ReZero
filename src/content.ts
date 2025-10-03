import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

import { isDev } from "~src/components/common/constants"
import { DEFAULT_SETTINGS } from "~src/components/settings/constants"
import type { SiteOverrideSettings, WaniSettings } from "~src/components/settings/types"
import {
  waniSettingsDeserializer,
  waniSettingsSerializer
} from "~src/components/settings/types"
import {
  TextReplacementEngine,
  type ReplacementSource,
  type ReplacementVocabulary,
} from "~src/services/textReplacer"
import { FastAhoCorasickReplacer } from "~src/services/fastAhoCorasickReplacer"
import { SiteFilter } from "~src/services/siteFilter"
import { AudioService, type AudioVocabularyItem } from "~src/services/audio"
import type { VocabularyCachePayload, VocabularyEntry } from "~src/services/vocabulary/types"
import { toggleTooltipVisibility, initializeTooltipPositioning } from "~src/services/tooltips"
import { ensureSafeRuntimeConnect } from "~src/utils/runtimeConnect"
import { log } from '~src/utils/log'
import { HotZoneTracker } from "~src/utils/hotZones"
import {
  __WK_EVT_GET_STATE,
  __WK_EVT_STATE,
  __WK_EVT_PERFORMANCE,
  __WK_EVT_TOGGLE_RUNTIME,
  __WK_EVT_RUNTIME,
  __WK_EVT_NAVIGATION,
  __WK_DATA_CONTAINER,
  __WK_DATA_SKIP,
} from '~src/internal/tokens'
import "./styles/style.css"

ensureSafeRuntimeConnect()

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_idle"
}

const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "CODE",
  "PRE",
  "KBD",
  "SAMP"
])

// Processing strategy threshold
const HEAVY_PAGE_NODE_THRESHOLD = 6000 // Pages with >= this many text nodes use time-sliced processing

// Processing constants for time-sliced mode (optimized settings)
const PROCESS_TIME_MS = 20 // Time in milliseconds to spend processing text nodes per batch
const CHARS_PER_BATCH = 10000 // Number of characters to process in a single batch
const MUTATION_DEBOUNCE_MS = 100 // Debounce delay in milliseconds for mutation observer events
const NODE_QUEUE_LENGTH = 6000 // Number of text nodes to queue before processing

// Tree walking and scheduling constants
const TREE_WALKING_CHUNK_TIME = 6 // ms chunks for tree walking
const TREE_WALKING_MAX_NODES_PER_CHUNK = 200 // Process at most 200 nodes per chunk
const TREE_WALKING_DELAY = 1 // ms delay between tree walking chunks
const SCHEDULING_DELAY = 5 // Delay to allow UI responsiveness
const CONTINUATION_DELAY = 5 // Continuation delay to allow UI responsiveness

// Performance and queue management constants
const PERFORMANCE_REPORT_BATCH_SIZE = 400 // Report performance every N processed nodes
const PERFORMANCE_REPORT_MIN_INTERVAL = 5000 // Minimum ms between performance reports



const structuredCloneFallback = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}


class ContentScriptController {
  private storage = new Storage({
    area: isDev ? "local" : "sync",
    serde: {
      serializer: (value) => JSON.stringify(value, waniSettingsSerializer),
      deserializer: (text) =>
        text ? JSON.parse(text, waniSettingsDeserializer) : text
    }
  })

  private settings: WaniSettings = this.cloneDefaultSettings()

  private replacer = new TextReplacementEngine()

  private fastReplacer = new FastAhoCorasickReplacer()

  private siteFilter = new SiteFilter()

  private activeOverride: SiteOverrideSettings | null = null

  private audioService = new AudioService()

  private vocabularyEntries: VocabularyEntry[] = []

  private replacementIndex = new Map<string, VocabularyEntry>()

  private mutationObserver?: MutationObserver

  private nodeQueue: Text[] = []

  private queuedNodes = new Set<Text>()

  private processedNodes = new WeakMap<Text, string>()

  private pendingIdleCallback: number | null = null

  private isRunning = false

  private hasNavigationHooks = false

  private lastUrl = window.location.href
  // Suppress replacements in rapidly mutating regions (hot zones)
  private hotTracker = new HotZoneTracker({
    zoneRootResolver: (el) => {
      /* eslint-disable local-i18n/hardcoded-ui-string */
      // Specific: DocSearch overlay containers first
      const docsearch = el.closest(
        '.DocSearch-Container, .DocSearch-Modal, [data-docsearch-root]'
      ) as Element | null
      if (docsearch) return docsearch
      // Common portals/dialogs used by UI libraries
      const portal = el.closest(
        '[role="dialog"], [role="listbox"], [role="menu"], [role="tooltip"], [data-headlessui-portal], [data-radix-portal]'
      ) as Element | null
      /* eslint-enable local-i18n/hardcoded-ui-string */
      return (portal || el) as Element
    }
  })

  private pendingMutations: MutationRecord[] = []

  private mutationDebounceTimer: number | null = null

  private performanceStats = {
    processedNodes: 0,
    totalProcessingTime: 0,
    longestNodeMs: 0
  }

  private lastPerformanceReport = 0
  private lastLoggedLongestNode = 0
  private totalTextNodesDetected = 0

  async init(): Promise<void> {
    this.settings = await this.loadSettings()
    this.updateSiteFilter()
    await this.loadBackgroundState()
    this.updateReplacerConfig()
    this.refreshReplacerVocabulary()
    this.registerStorageListener()

    // Initialize tooltip positioning for better visibility
    initializeTooltipPositioning(document)

    if (this.shouldRun()) {
      this.start()
    }
  }

  private shouldRun(): boolean {
  this.activeOverride = this.siteFilter.getOverride(window.location.href)

    const defaultAutoRun = Boolean(this.settings.autoRun)
    const overrideAutoRun = this.activeOverride?.autoRun

    if (overrideAutoRun === true) {
      return true
    }

    if (overrideAutoRun === false) {
      return false
    }

  if (this.siteFilter.shouldBlock(window.location.href)) {
      return false
    }

    return defaultAutoRun
  }

  private cloneDefaultSettings(): WaniSettings {
    const base = DEFAULT_SETTINGS

    return {
      version: base.version,
      apiToken: base.apiToken,
      autoRun: base.autoRun,
      audio: structuredCloneFallback(base.audio),
      showReplacementTooltips: base.showReplacementTooltips,
      numbersReplacement: base.numbersReplacement,
      performanceTelemetry: base.performanceTelemetry,
      srsGroups: structuredCloneFallback(base.srsGroups),
      customVocabulary: new Map(base.customVocabulary),
      vocabularyBlacklist: new Set(base.vocabularyBlacklist),
      sitesFiltering: [...base.sitesFiltering],
      spreadsheetImport: structuredCloneFallback(base.spreadsheetImport),
      siteOverrides: structuredCloneFallback(base.siteOverrides ?? {})
    }
  }

  private async loadSettings(): Promise<WaniSettings> {
    try {
      const storedSettings = await this.storage.get<WaniSettings>("WaniSettings")

      if (!storedSettings) {
        return this.cloneDefaultSettings()
      }

      const customVocabularySource = storedSettings.customVocabulary
      const vocabularyEntries = customVocabularySource
        ? customVocabularySource instanceof Map
          ? Array.from(customVocabularySource.entries())
          : Array.isArray(customVocabularySource)
            ? customVocabularySource
            : Object.entries(customVocabularySource as Record<string, ReplacementSource>)
        : []

      const blacklistSource = storedSettings.vocabularyBlacklist
      const blacklistEntries = blacklistSource
        ? blacklistSource instanceof Set
          ? Array.from(blacklistSource.values())
          : Array.isArray(blacklistSource)
            ? blacklistSource
            : Object.values(blacklistSource as Record<string, string>)
        : []

      return {
        version: storedSettings.version ?? DEFAULT_SETTINGS.version,
        apiToken: storedSettings.apiToken ?? "",
        autoRun: Boolean(storedSettings.autoRun),
        audio: structuredCloneFallback({
          ...DEFAULT_SETTINGS.audio,
          ...(storedSettings.audio ?? {})
        }),
        showReplacementTooltips:
          storedSettings.showReplacementTooltips ?? DEFAULT_SETTINGS.showReplacementTooltips,
        numbersReplacement:
          storedSettings.numbersReplacement ?? DEFAULT_SETTINGS.numbersReplacement,
        performanceTelemetry:
          storedSettings.performanceTelemetry ?? DEFAULT_SETTINGS.performanceTelemetry,
        srsGroups: {
          ...DEFAULT_SETTINGS.srsGroups,
          ...(storedSettings.srsGroups ?? {})
        },
        customVocabulary: new Map(
          vocabularyEntries as Array<[string, ReplacementSource]>
        ),
        vocabularyBlacklist: new Set(blacklistEntries),
        sitesFiltering: [...(storedSettings.sitesFiltering ?? [])],
        spreadsheetImport: structuredCloneFallback(
          storedSettings.spreadsheetImport ?? []
        ),
        siteOverrides: structuredCloneFallback(storedSettings.siteOverrides ?? {})
      }
    } catch (error) {
      log.error('failed to load settings', error)
      return this.cloneDefaultSettings()
    }
  }

  private registerStorageListener(): void {
    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName !== (isDev ? "local" : "sync")) {
        return
      }

      if (!changes?.WaniSettings) {
        return
      }

      await this.reloadSettings()
    })

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message !== "object") {
        return
      }

      switch (message.type) {

        case __WK_EVT_TOGGLE_RUNTIME: {
          const running = this.toggleRuntime()
          sendResponse?.({ type: __WK_EVT_RUNTIME, payload: { running } })
          break
        }
        case __WK_EVT_STATE: {
          this.applyVocabularyState(message.payload?.vocabulary)
          break
        }
        default:
          break
      }

      return false
    })
  }

  private async reloadSettings(): Promise<void> {
    const newSettings = await this.loadSettings()
    this.settings = newSettings
    this.updateSiteFilter()
    // Determine whether we should be running on the current page after applying
    // the latest settings and site filtering rules (including overrides).
    const nowShouldRun = this.shouldRun()

    this.updateReplacerConfig()
    this.refreshReplacerVocabulary()

    // If we're currently running but the page is now blocked, stop immediately
    if (!nowShouldRun && this.isRunning) {
      this.stop()
      return
    }

    // If we're not running and the page is allowed with auto-run, start
    if (nowShouldRun && !this.isRunning) {
      this.start(true)
      return
    }

    // If still running and allowed, re-process with latest rules
    if (this.isRunning && nowShouldRun) {
      this.enqueueFullDocument(true)
    }
  }

  private refreshReplacerVocabulary(): void {
    this.replacementIndex.clear()

    const replacements = new Map<
      string,
      {
        original: string
        source: ReplacementSource
        priority: number
        entry?: VocabularyEntry
      }
    >()
    const audioEntries = new Map<string, AudioVocabularyItem>()

    const addReplacement = (
      englishWord: string,
      source: ReplacementSource,
      priority: number,
      entry?: VocabularyEntry
    ) => {
      const normalized = englishWord?.trim()
      if (!normalized) {
        return
      }

      const key = normalized.toLowerCase()
      const existing = replacements.get(key)

      if (!existing || priority >= existing.priority) {
        replacements.set(key, {
          original: normalized,
          source,
          priority,
          entry
        })
      }
    }

    const registerAudioEntry = (
      entry: VocabularyEntry | null,
      fallbackReading?: string
    ) => {
      if (!entry?.japanese) {
        return
      }
      if (!audioEntries.has(entry.japanese)) {
        audioEntries.set(entry.japanese, {
          japanese: entry.japanese,
          reading: entry.reading ?? fallbackReading,
          audioUrls: entry.audioUrls ?? []
        })
      }
    }

    this.vocabularyEntries?.forEach((entry) => {
      if (!entry?.english?.length || !entry.japanese) {
        return
      }

      entry.english.forEach((englishWord) => {
        addReplacement(
          englishWord,
          {
            japanese: entry.japanese,
            reading: entry.reading
          },
          entry.priority ?? 0,
          entry
        )
      })

      registerAudioEntry(entry)
    })

    if (this.settings.customVocabulary?.size) {
      for (const [rawEnglish, data] of this.settings.customVocabulary.entries()) {
        const english = rawEnglish?.trim()

        if (!english || !data?.japanese) {
          continue
        }

        const entry: VocabularyEntry = {
          id: `custom:${english}`,
          english: [english],
          japanese: data.japanese,
          reading: data.reading,
          source: "custom",
          priority: Number.MAX_SAFE_INTEGER,
          audioUrls: []
        }

        addReplacement(
          english,
          {
            japanese: data.japanese,
            reading: data.reading
          },
          Number.MAX_SAFE_INTEGER,
          entry
        )

        registerAudioEntry(entry)
      }
    }

    const blacklist = new Set<string>()

    this.settings.vocabularyBlacklist?.forEach((rawEntry) => {
      const entry = rawEntry?.trim()

      if (!entry) {
        return
      }
      blacklist.add(entry.toLowerCase())
    })

    const vocabulary: ReplacementVocabulary = new Map()

    for (const [key, value] of replacements.entries()) {
      if (blacklist.has(key)) {
        continue
      }

      vocabulary.set(value.original, value.source)

      const entry = value.entry ?? {
        id: `fallback:${value.original}`,
        english: [value.original],
        japanese: value.source.japanese,
        reading: value.source.reading,
        source: "custom",
        priority: value.priority,
        audioUrls: []
      }

      this.replacementIndex.set(key, entry)
    }

    this.replacer.setVocabulary(vocabulary, blacklist)
    this.audioService.setVocabulary(Array.from(audioEntries.values()))
    this.fastReplacer.setVocabulary(vocabulary, blacklist, false)
  }

  private applyVocabularyState(vocabulary: VocabularyCachePayload | null | undefined): void {
    this.vocabularyEntries = vocabulary?.vocabularyEntries ?? []
    this.refreshReplacerVocabulary()
    // Process already-present nodes with updated vocabulary
    if (this.isRunning) {
      this.enqueueFullDocument(true)
    }
  }

  private async loadBackgroundState(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type: __WK_EVT_GET_STATE })

      if (response?.type === __WK_EVT_STATE) {
        this.applyVocabularyState(response.payload?.vocabulary)
      }
    } catch (error) {
  log.debug('unable to fetch background state', error)
    }
  }

  private maybeReportPerformance(): void {
    if (this.performanceStats.processedNodes === 0) {
      return
    }

    const telemetryEnabled = this.settings.performanceTelemetry || isDev

    if (!telemetryEnabled) {
      return
    }

    const hitsBatchThreshold = this.performanceStats.processedNodes % PERFORMANCE_REPORT_BATCH_SIZE === 0
    const hasNewLongest = this.performanceStats.longestNodeMs > 0

    if (!hitsBatchThreshold && !hasNewLongest) {
      return
    }

    const now = performance.now()

    if (!hasNewLongest && now - this.lastPerformanceReport < PERFORMANCE_REPORT_MIN_INTERVAL) {
      return
    }

    this.lastPerformanceReport = now
    const average =
      this.performanceStats.totalProcessingTime /
      this.performanceStats.processedNodes

    chrome.runtime
      .sendMessage({
        type: __WK_EVT_PERFORMANCE,
        payload: {
          processedNodes: this.performanceStats.processedNodes,
          averageMs: Number(average.toFixed(2)),
          longestMs: Number(this.performanceStats.longestNodeMs.toFixed(2))
        }
      })
      .catch(() => {})

    this.performanceStats.longestNodeMs = 0
  }



  private toggleRuntime(): boolean {
    if (this.isRunning) {
      this.stop()
    } else {
      this.start(true)
    }

    return this.isRunning
  }

  private updateReplacerConfig(): void {
    const numbersReplacementOverride = this.activeOverride?.numbersReplacement

    this.replacer.updateConfig({
      caseSensitive: false,
      matchWholeWord: true,
      numbersReplacement: Boolean(
        numbersReplacementOverride ?? this.settings.numbersReplacement
      )
    })
  }

  private updateSiteFilter(): void {
    this.siteFilter.setPatterns({
      block: this.settings.sitesFiltering ?? []
    })

    this.siteFilter.setOverrides(this.settings.siteOverrides ?? {})

  this.activeOverride = this.siteFilter.getOverride(window.location.href)
    this.updateAudioSettings()
    this.applyTooltipPreference()
  }

  private updateAudioSettings(): void {
    const overrideAudio = this.activeOverride?.audio

    const enabled = overrideAudio?.enabled ?? this.settings.audio.enabled
    const mode = overrideAudio?.mode ?? this.settings.audio.mode
    const volume = overrideAudio?.volume ?? this.settings.audio.volume ?? 1

    this.audioService.updateSettings({
      enabled,
      mode,
      volume
    })
  }

  private applyTooltipPreference(): void {
    const tooltipOverride = this.activeOverride?.showReplacementTooltips
    const shouldShow =
      typeof tooltipOverride === "boolean"
        ? tooltipOverride
        : Boolean(this.settings.showReplacementTooltips)

    toggleTooltipVisibility(document, shouldShow)
  }



  private start(force = false): void {
    if (this.isRunning && !force) {
      return
    }

    this.isRunning = true
    this.hotTracker.reset()
    this.ensureNavigationHooks()
    this.observeMutations()
    this.enqueueFullDocument(force)
  }

  private stop(): void {
    this.isRunning = false
    this.disconnectObserver()
    this.clearPendingWork()
    this.replacer.revertAll()
    this.processedNodes = new WeakMap()
    this.audioService.stop()
    this.hotTracker.reset()
  }

  private ensureNavigationHooks(): void {
    if (this.hasNavigationHooks) {
      return
    }

    const dispatchNavigationEvent = () => {
      window.dispatchEvent(new Event(__WK_EVT_NAVIGATION))
    }

    const wrapHistoryMethod = (method: "pushState" | "replaceState") => {
      const original = history[method]
      history[method] = function (...args) {
        const result = original.apply(this, args as Parameters<typeof original>)
        dispatchNavigationEvent()
        return result
      }
    }

    wrapHistoryMethod("pushState")
    wrapHistoryMethod("replaceState")

    window.addEventListener("popstate", dispatchNavigationEvent, true)
    window.addEventListener("hashchange", dispatchNavigationEvent, true)
    window.addEventListener(
      __WK_EVT_NAVIGATION,
      this.handleNavigationChange,
      true
    )

    this.hasNavigationHooks = true
  }

  private handleNavigationChange = (): void => {
  if (window.location.href === this.lastUrl) {
      return
    }

  this.lastUrl = window.location.href
    const shouldRunNow = this.shouldRun()
    this.updateReplacerConfig()
    this.updateAudioSettings()

    if (!shouldRunNow) {
      if (this.isRunning) {
        this.stop()
      }
      return
    }

    if (!this.isRunning) {
      this.start(true)
      return
    }

    this.enqueueFullDocument(true)
  }

  private observeMutations(): void {
    if (this.mutationObserver) {
      return
    }

    const observer = new MutationObserver((records) => {
      this.handleMutations(records)
    })

    const startObserver = () => {
      if (!document.body) {
        return
      }

      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true
      })

      this.mutationObserver = observer
    }

    if (document.body) {
      startObserver()
    } else {
      window.addEventListener("DOMContentLoaded", startObserver, {
        once: true
      })
    }
  }

  private disconnectObserver(): void {
  this.mutationObserver?.disconnect()
  this.mutationObserver = undefined
  }

  private handleMutations(records: MutationRecord[]): void {
    if (!this.isRunning) {
      return
    }

    // Detect rapidly mutating regions and temporarily mark them as hot (skip replacements)
    this.hotTracker.mark(records)

    this.pendingMutations.push(...records)

    if (this.mutationDebounceTimer !== null) {
      return
    }

    this.mutationDebounceTimer = window.setTimeout(() => {
      this.flushPendingMutations()
    }, MUTATION_DEBOUNCE_MS)
  }

  private flushPendingMutations(): void {
    if (!this.pendingMutations.length) {
      this.mutationDebounceTimer = null
      return
    }

    const mutations = this.pendingMutations.splice(0)
    this.mutationDebounceTimer = null

    for (const record of mutations) {
      if (record.type === "characterData" && record.target.nodeType === Node.TEXT_NODE) {
        this.enqueueTextNode(record.target as Text)
        continue
      }

      if (record.type === "childList") {
        record.addedNodes.forEach((node) => this.enqueueNode(node))
      }
    }
  }

  private enqueueFullDocument(resetCache = false): void {
    const process = () => {
      if (resetCache) {
        this.replacer.revertAll()
        this.processedNodes = new WeakMap()
        this.performanceStats = { processedNodes: 0, totalProcessingTime: 0, longestNodeMs: 0 }
        this.lastPerformanceReport = performance.now()
        this.totalTextNodesDetected = 0
      }

      // Analyze page complexity to determine processing approach
      const pageAnalysis = this.analyzePage()
      
      if (pageAnalysis.shouldUseFastRegex) {
        log.debug('Using fast regex processing for light page', pageAnalysis)
        this.processWithFastRegex()
      } else {
        log.debug('Using time-sliced processing for heavy page', pageAnalysis)
        this.enqueueNode(document.body)
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", process, { once: true })
      return
    }

    process()
  }

  private enqueueNode(node: Node | null): void {
    if (!node) {
      return
    }

    if (node.nodeType === Node.TEXT_NODE) {
      this.enqueueTextNode(node as Text)
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const element = node as Element

    if (this.shouldIgnoreElement(element)) {
      return
    }

    // Use chunked tree walking to avoid blocking the UI
    this.scheduleTreeWalking(element)
  }

  private scheduleTreeWalking(element: Element): void {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (candidate) =>
          this.shouldIgnoreTextNode(candidate as Text)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT
      }
    )

    const walkInChunks = () => {
      const start = performance.now()
      let nodesProcessed = 0
      const maxChunkTime = TREE_WALKING_CHUNK_TIME
      const maxNodesPerChunk = TREE_WALKING_MAX_NODES_PER_CHUNK

      let current = walker.nextNode()
      while (current && performance.now() - start < maxChunkTime && nodesProcessed < maxNodesPerChunk) {
        this.enqueueTextNode(current as Text)
        current = walker.nextNode()
        nodesProcessed++
      }

      if (current) {
        setTimeout(walkInChunks, TREE_WALKING_DELAY)
      }
    }

    walkInChunks()
  }

  private enqueueTextNode(node: Text): void {
    if (this.shouldIgnoreTextNode(node)) {
      return
    }

    if (this.queuedNodes.has(node)) {
      return
    }

    this.queuedNodes.add(node)
    this.totalTextNodesDetected++

    const maxQueueLength = NODE_QUEUE_LENGTH

    if (this.nodeQueue.length >= maxQueueLength) {
      const removed = this.nodeQueue.shift()
      if (removed) {
        // Instead of silently discarding the oldest node (which can cause missed
        // replacements on very content‑dense pages), attempt a
        // fast inline processing pass. We guard with basic safety checks to
        // avoid heavy synchronous work in pathological cases.
        this.queuedNodes.delete(removed)
        if (removed.isConnected && removed.length < 3000) {
          // Process immediately without scheduling so we don't lose the node.
            try {
              this.processTextNode(removed)
            } catch {
              // Swallow any unexpected errors; worst case the node is skipped.
            }
        }
      }
    }
    this.nodeQueue.push(node)
    this.scheduleProcessing()
  }

  private scheduleProcessing(): void {
    if (this.pendingIdleCallback !== null) {
      return
    }

    this.pendingIdleCallback = window.setTimeout(() => {
      this.pendingIdleCallback = null
      this.flushQueue()
    }, SCHEDULING_DELAY)
  }

  private flushQueue(deadline?: IdleDeadline): void {
    const start = performance.now()
    let processedChars = 0
    const maxProcessTime = PROCESS_TIME_MS
    const maxCharsPerBatch = CHARS_PER_BATCH

    while (this.nodeQueue.length > 0) {
      if (deadline) {
        if (!deadline.didTimeout && deadline.timeRemaining() <= 0) {
          break
        }
      } else if (performance.now() - start > maxProcessTime) {
        break
      }

      if (processedChars >= maxCharsPerBatch) {
        break
      }

      const node = this.nodeQueue.shift()!
      this.queuedNodes.delete(node)
      processedChars += node.length

      this.processTextNode(node)
    }

    if (this.nodeQueue.length > 0) {
      setTimeout(() => {
        this.scheduleProcessing()
      }, CONTINUATION_DELAY)
    }
  }

  private processTextNode(node: Text): void {
    if (!node.isConnected) {
      this.processedNodes.delete(node)
      return
    }

    const parent = node.parentElement

    if (!parent || this.shouldIgnoreElement(parent)) {
      this.processedNodes.delete(node)
      return
    }

    const currentContent = node.data
    const previousContent = this.processedNodes.get(node)

    if (previousContent === currentContent) {
      return
    }

    const start = performance.now()
    const result = this.replacer.replaceNode(node)
    const duration = performance.now() - start
    this.performanceStats.totalProcessingTime += duration
    this.performanceStats.processedNodes += 1
    if (duration > this.performanceStats.longestNodeMs) {
      this.performanceStats.longestNodeMs = duration
    }

    if ((isDev || this.settings.performanceTelemetry) && duration > this.lastLoggedLongestNode) {
      this.lastLoggedLongestNode = duration
  log.debug('longest replaceNode duration', duration.toFixed(2), 'ms', '(node length:', node.length, ')')
    }

    if (result.matches.length) {
      this.audioService.handleReplacements()
    }

    this.processedNodes.set(node, node.data)
    this.maybeReportPerformance()
  }

  private shouldIgnoreTextNode(node: Text): boolean {
    if (!node || !node.textContent || !node.textContent.trim()) {
      return true
    }

    const parent = node.parentElement

    if (!parent) {
      return true
    }

    if (parent.closest(`[${__WK_DATA_CONTAINER}]`)) {
      return true
    }

    return this.shouldIgnoreElement(parent)
  }

  private shouldIgnoreElement(element: Element): boolean {
    // Skip text inside recently hot (rapidly mutating) regions
    if (this.hotTracker.isHot(element)) {
      return true
    }
    if (IGNORED_TAGS.has(element.tagName)) {
      return true
    }

    if (element.hasAttribute(__WK_DATA_CONTAINER)) {
      return true
    }

    if (element.closest(`[${__WK_DATA_CONTAINER}]`)) {
      return true
    }

    if (element.closest(`[${__WK_DATA_SKIP}='true']`)) {
      return true
    }

    if (element.getAttribute(__WK_DATA_SKIP) === "true") {
      return true
    }

    // Check for contenteditable elements - only ignore if contenteditable="true" or contenteditable=""
    const contentEditable = element.getAttribute("contenteditable")
    if (contentEditable === "true" || contentEditable === "") {
      return true
    }

    // Also check if any ancestor has contenteditable="true" or contenteditable=""
    const trueAttr = 'contenteditable="true"'
    const emptyAttr = 'contenteditable=""'
    if (element.closest(`[${trueAttr}], [${emptyAttr}]`)) {
      return true
    }

    // Note: input/textarea check is redundant since IGNORED_TAGS already handles these tag types
    // but we keep it for explicit ancestor checking (e.g., elements inside shadow DOM inputs)
    if (element.closest("input, textarea")) {
      return true
    }

    if (element.getAttribute("aria-hidden") === "true") {
      return true
    }

    // Heuristic: avoid interfering with dynamic documentation search overlays (e.g. Algolia DocSearch,
    // Nextra search, Headless UI/Radix portals) which perform their own virtual DOM diffing and can
    // break if internal text nodes are mutated. This specifically addresses an observed
    // "Cancel rendering route" client-side exception on docs.plasmo.com when interacting with the
    // search dialog while Auto Run is enabled.
    try {
      /* eslint-disable local-i18n/hardcoded-ui-string */
      // Limit ancestor scanning to avoid blocking entire pages due to a far ancestor
      const isWithin = (sel: string, maxDepth = 3) => {
        let el: Element | null = element
        let depth = 0
        while (el && depth <= maxDepth) {
          if (el.matches(sel)) return true
          el = el.parentElement
          depth += 1
        }
        return false
      }

      // If a search/modal overlay is open, avoid mutating nodes inside it only
      const overlayRoot = document.querySelector(
        '.DocSearch-Container, .DocSearch-Modal, [data-docsearch-root]'
      )
      if (
        overlayRoot &&
        element.closest('.DocSearch-Container, .DocSearch-Modal, [data-docsearch-root]')
      ) {
        return true
      }

      // If a search-like element is currently focused, avoid mutating the subtree around it
      const isSearchLikeElement = (el: Element | null): boolean => {
        if (!el) return false
        const role = el.getAttribute('role')?.toLowerCase()
        if (role === 'searchbox' || role === 'combobox') return true
        const tag = el.tagName.toLowerCase()
        const type = (el as HTMLInputElement).type?.toLowerCase?.()
        if (tag === 'input' && (type === 'search' || type === 'text')) {
          const placeholder = (el as HTMLInputElement).placeholder?.toLowerCase?.()
          const ariaLabel = el.getAttribute('aria-label')?.toLowerCase()
          if (placeholder?.includes('search') || ariaLabel?.includes('search')) return true
        }
        return false
      }
      const activeEl = document.activeElement as Element | null
      if (isSearchLikeElement(activeEl)) {
        const activeRoot =
          activeEl.closest('.DocSearch-Container, .DocSearch-Modal, [data-docsearch-root]') ||
          activeEl.closest('[role="search"], [role="searchbox"], [role="combobox"]')
        if (
          (activeRoot && (element === activeRoot || activeRoot.contains(element))) ||
          element.contains(activeEl) ||
          (activeEl && activeEl.contains(element))
        ) {
          return true
        }
      }
      if (
        // Algolia DocSearch containers
  element.closest('.DocSearch-Container, .DocSearch-Modal, [data-docsearch-root]') ||
        // Generic: any search region
        isWithin('[role="search"], [role="searchbox"]', 2) ||
        // ARIA interactive patterns involved in typeahead/search UIs
        isWithin('[role="combobox"], [role="listbox"], [role="option"]', 2) ||
        // Live regions / busy sections frequently re-render
        isWithin('[aria-live], [aria-busy="true"]', 1) ||
        // Common portal markers used by Headless UI / Radix / generic portals
        isWithin('[data-headlessui-portal], [data-radix-portal], [data-portal], .react-portal', 3) ||
        // Nextra/Docs search classes and generic docsearch id hooks
        isWithin('[id*="docsearch" i], [class*="nextra-search" i], [class*="nextra" i]', 2)
      ) {
        return true
      }
      // Avoid touching nodes inside elements with class containing these substrings
      const cls = element.className || ''
      if (typeof cls === 'string') {
        const lowered = cls.toLowerCase()
        if (
          lowered.includes('docsearch') ||
          lowered.includes('algolia') ||
          lowered.includes('searchbox') ||
          lowered.includes('nextra')
        ) {
          return true
        }
      }

      // If a focused search-like input exists, avoid mutating nearby DOM
      const active = document.activeElement as Element | null
      if (active && (active.matches('input, textarea') || active.getAttribute('role') === 'searchbox')) {
        if (element === active || element.contains(active) || active.contains(element)) {
          return true
        }
      }
      /* eslint-enable local-i18n/hardcoded-ui-string */
    } catch {
      // Defensive: DOM exceptions should not break processing
    }

    return false
  }

  /**
   * Analyze page structure to determine optimal processing approach.
   */
  private analyzePage(): { shouldUseFastRegex: boolean; textNodeCount: number; estimatedPageSize: string } {
    const startTime = performance.now()
    
    // Quick scan to estimate page complexity
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = (node as Text).parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          
          // Skip if in ignored tags
          if (IGNORED_TAGS.has(parent.tagName.toUpperCase())) {
            return NodeFilter.FILTER_REJECT
          }
          
          // Skip empty or whitespace-only nodes
          const text = (node as Text).textContent || ''
          if (!text.trim()) {
            return NodeFilter.FILTER_REJECT
          }
          
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )

    let textNodeCount = 0
    let totalTextLength = 0
    let current = walker.nextNode()
    
    // Limit scanning time to avoid blocking
    while (current && (performance.now() - startTime) < 50) {
      textNodeCount++
      totalTextLength += (current.textContent || '').length
      current = walker.nextNode()
    }

    const shouldUseFastRegex = textNodeCount < HEAVY_PAGE_NODE_THRESHOLD
    const estimatedPageSize = totalTextLength > 100000 ? 'large' : 
                              totalTextLength > 10000 ? 'medium' : 'small'

    log.debug('Page analysis completed', {
      textNodeCount,
      totalTextLength,
      shouldUseFastRegex,
      estimatedPageSize,
      analysisTime: performance.now() - startTime
    })

    return { shouldUseFastRegex, textNodeCount, estimatedPageSize }
  }

  /**
   * Fast regex-based processing for light pages
   */
  private processWithFastRegex(): void {
    const startTime = performance.now()
    
    this.fastReplacer.replaceTextNodesInElement(document.body)
    
    const processingTime = performance.now() - startTime
    log.debug('Fast regex processing completed', {
      processingTime: `${processingTime.toFixed(2)}ms`
    })

    this.initializeFeaturesForProcessedContent()
  }

  /**
   * Initialize audio and tooltip features for processed content
   */
  private initializeFeaturesForProcessedContent(): void {
    if (this.settings.audio.enabled) {
      this.audioService.handleReplacements()
    }

    // Tooltips are handled automatically by the global system
  }

  private clearPendingWork(): void {
    if (this.pendingIdleCallback !== null) {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(this.pendingIdleCallback)
      } else {
        clearTimeout(this.pendingIdleCallback)
      }

      this.pendingIdleCallback = null
    }

    this.nodeQueue = []
    this.queuedNodes.clear()
    this.pendingMutations = []
    this.performanceStats.longestNodeMs = 0
    this.lastLoggedLongestNode = 0
    if (this.mutationDebounceTimer !== null) {
      clearTimeout(this.mutationDebounceTimer)
      this.mutationDebounceTimer = null
    }
  }
}

const controller = new ContentScriptController()

controller
  .init()
  .catch((error) => log.error('content script failed to initialize', error))

export {}


