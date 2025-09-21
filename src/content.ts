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
  type ReplacementDetail
} from "~src/services/textReplacer"
import { SiteFilter } from "~src/services/siteFilter"
import { AudioService, type AudioVocabularyItem } from "~src/services/audio"
import type { VocabularyCachePayload, VocabularyEntry } from "~src/services/vocabulary/types"
import { toggleTooltipVisibility, initializeTooltipPositioning } from "~src/services/tooltips"
import { ensureSafeRuntimeConnect } from "~src/utils/runtimeConnect"
import { log } from '~src/utils/log'
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

const MAX_PROCESS_TIME_MS = 6
const MAX_CHARS_PER_BATCH = 6000
const MUTATION_DEBOUNCE_MS = 50
const MAX_NODE_QUEUE_LENGTH = 2000

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

  private lastUrl = location.href

  private pendingMutations: MutationRecord[] = []

  private mutationDebounceTimer: number | null = null

  private performanceStats = {
    processedNodes: 0,
    totalProcessingTime: 0,
    longestNodeMs: 0
  }

  private lastPerformanceReport = 0
  private lastLoggedLongestNode = 0

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
    this.activeOverride = this.siteFilter.getOverride(location.href)

    const defaultAutoRun = Boolean(this.settings.autoRun)
    const overrideAutoRun = this.activeOverride?.autoRun

    if (overrideAutoRun === true) {
      return true
    }

    if (overrideAutoRun === false) {
      return false
    }

    if (this.siteFilter.shouldBlock(location.href)) {
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
      console.error("WaniKanify: failed to load settings", error)
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

        case "wanikanify:toggle-runtime": {
          const running = this.toggleRuntime()
          sendResponse?.({ type: "wanikanify:runtime", payload: { running } })
          break
        }
        case "wanikanify:state": {
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
    const shouldRestart = !this.isRunning && newSettings.autoRun
    const shouldStop = this.isRunning && !newSettings.autoRun

    this.settings = newSettings
    this.updateSiteFilter()
    this.updateReplacerConfig()
    this.refreshReplacerVocabulary()

    if (shouldStop) {
      this.stop()
      return
    }

    if (shouldRestart) {
      this.start(true)
      return
    }

    if (this.isRunning) {
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
  }

  private applyVocabularyState(vocabulary: VocabularyCachePayload | null | undefined): void {
    this.vocabularyEntries = vocabulary?.vocabularyEntries ?? []
    this.refreshReplacerVocabulary()
    // Ensure that after vocabulary loads from background we process already-present nodes
    // with the freshly compiled automaton to avoid missing early static content.
    if (this.isRunning) {
      this.enqueueFullDocument(true)
    }
  }

  private async loadBackgroundState(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type: "wanikanify:get-state" })

      if (response?.type === "wanikanify:state") {
        this.applyVocabularyState(response.payload?.vocabulary)
      }
    } catch (error) {
      log.debug("WaniKanify: unable to fetch background state", error)
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

    const hitsBatchThreshold = this.performanceStats.processedNodes % 200 === 0
    const hasNewLongest = this.performanceStats.longestNodeMs > 0

    if (!hitsBatchThreshold && !hasNewLongest) {
      return
    }

    const now = performance.now()

    if (!hasNewLongest && now - this.lastPerformanceReport < 5000) {
      return
    }

    this.lastPerformanceReport = now
    const average =
      this.performanceStats.totalProcessingTime /
      this.performanceStats.processedNodes

    chrome.runtime
      .sendMessage({
        type: "wanikanify:performance",
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
    this.activeOverride = this.siteFilter.getOverride(location.href)
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
  }

  private ensureNavigationHooks(): void {
    if (this.hasNavigationHooks) {
      return
    }

    const dispatchNavigationEvent = () => {
      window.dispatchEvent(new Event("wanikanify:navigation"))
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
      "wanikanify:navigation",
      this.handleNavigationChange,
      true
    )

    this.hasNavigationHooks = true
  }

  private handleNavigationChange = (): void => {
    if (location.href === this.lastUrl) {
      return
    }

    this.lastUrl = location.href
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
      }

      this.enqueueNode(document.body)
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

    let current = walker.nextNode()

    while (current) {
      this.enqueueTextNode(current as Text)
      current = walker.nextNode()
    }
  }

  private enqueueTextNode(node: Text): void {
    if (this.shouldIgnoreTextNode(node)) {
      return
    }

    if (this.queuedNodes.has(node)) {
      return
    }

    this.queuedNodes.add(node)
    if (this.nodeQueue.length >= MAX_NODE_QUEUE_LENGTH) {
      const removed = this.nodeQueue.shift()
      if (removed) {
        // Instead of silently discarding the oldest node (which can cause missed
        // replacements on very content‑dense pages like Wiktionary), attempt a
        // fast inline processing pass. We guard with basic safety checks to
        // avoid heavy synchronous work in pathological cases.
        this.queuedNodes.delete(removed)
        if (removed.isConnected && removed.length < 2000) {
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

    this.pendingIdleCallback = this.requestIdleCallback((deadline) => {
      this.pendingIdleCallback = null
      this.flushQueue(deadline)
    })
  }

  private flushQueue(deadline?: IdleDeadline): void {
    const start = performance.now()
    let processedChars = 0

    while (this.nodeQueue.length > 0) {
      if (deadline) {
        if (!deadline.didTimeout && deadline.timeRemaining() <= 0) {
          break
        }
      } else if (performance.now() - start > MAX_PROCESS_TIME_MS) {
        break
      }

      if (processedChars >= MAX_CHARS_PER_BATCH) {
        break
      }

      const node = this.nodeQueue.shift()!
      this.queuedNodes.delete(node)
      processedChars += node.length

      this.processTextNode(node)
    }

    if (this.nodeQueue.length > 0) {
      this.scheduleProcessing()
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
  log.debug('WaniKanify: longest replaceNode duration', duration.toFixed(2), 'ms', '(node length:', node.length, ')')
    }

    if (result.matches.length) {
      this.audioService.handleReplacements(result.matches)
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

    if (parent.closest("[data-wanikanify-container]")) {
      return true
    }

    return this.shouldIgnoreElement(parent)
  }

  private shouldIgnoreElement(element: Element): boolean {
    if (IGNORED_TAGS.has(element.tagName)) {
      return true
    }

    if (element.hasAttribute("data-wanikanify-container")) {
      return true
    }

    if (element.closest("[data-wanikanify-container]")) {
      return true
    }

    if (element.closest("[data-wanikanify-skip='true']")) {
      return true
    }

    if (element.getAttribute("data-wanikanify-skip") === "true") {
      return true
    }

    if (element.hasAttribute("contenteditable")) {
      return true
    }

    if (element.closest("input, textarea")) {
      return true
    }

    if (element.getAttribute("aria-hidden") === "true") {
      return true
    }

    return false
  }

  private requestIdleCallback(callback: IdleRequestCallback): number {
    if (typeof window.requestIdleCallback === "function") {
      return window.requestIdleCallback(callback, { timeout: 250 })
    }

    return window.setTimeout(() => {
      const start = performance.now()
      callback({
        didTimeout: true,
        timeRemaining: () => Math.max(0, MAX_PROCESS_TIME_MS - (performance.now() - start))
      } as IdleDeadline)
    }, 0)
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
  .catch((error) => console.error("WaniKanify: failed to initialize", error))

export {}


