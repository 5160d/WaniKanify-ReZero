import type { AudioMode } from "~src/components/settings/toggles/types"
import { t } from '~src/utils/i18n'
import { __WK_CLASS_REPLACEMENT } from '~src/internal/tokens'
import { log } from '~src/utils/log'

const PUNCTUATION_EDGE_REGEX = /^[\p{P}\p{Zs}]+|[\p{P}\p{Zs}]+$/gu

type AudioSettings = {
  enabled: boolean
  mode: AudioMode
  volume: number
}

export type AudioVocabularyItem = {
  japanese: string
  reading?: string
  audioUrls?: string[]
}

type AudioCacheEntry = {
  audio: HTMLAudioElement
  objectUrl?: string
}

type WordInfo = {
  word: string
}

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max)

const sanitizeWord = (word: string): string =>
  word.trim().replace(PUNCTUATION_EDGE_REGEX, "")

const hasSpeechSynthesis = () => typeof window !== "undefined" && "speechSynthesis" in window

export class AudioService {
  private settings: AudioSettings = {
    enabled: false,
    mode: "click",
    volume: 1
  }

  private vocabularyAudio = new Map<string, AudioVocabularyItem>()
  private audioCache = new Map<string, AudioCacheEntry>()
  private currentAudio: HTMLAudioElement | null = null
  private hoverTimeout: number | null = null
  private lastHoverWord: string | null = null
  private clickListener = this.handleClick.bind(this)
  private hoverListener = this.handleHover.bind(this)
  private prefetchedUrls = new Set<string>()
  private prefetchTimer: number | null = null
  private lastFeatureInitTime: number = 0
  private featureInitCooldown: number = 500
  private prefetchQueue: string[] = []
  private isProcessingQueue: boolean = false
  private maxConcurrentRequests: number = 2
  private requestDelayMs: number = 100

  updateSettings(settings: AudioSettings): void {
    const allowedModes: AudioMode[] = ["click", "hover"]
    const requestedMode = (settings.mode ?? "click") as AudioMode
    const mode = allowedModes.includes(requestedMode) ? requestedMode : "click"

    const normalized: AudioSettings = {
      enabled: Boolean(settings.enabled),
      mode,
      volume: clamp(settings.volume ?? 1)
    }

    const previousMode = this.settings.mode
    const previousEnabled = this.settings.enabled
    this.settings = normalized

    if (this.currentAudio) {
      this.currentAudio.volume = normalized.volume
    }

    if (previousMode !== normalized.mode || previousEnabled !== normalized.enabled) {
      this.refreshEventListeners()
    }
  }

  setVocabulary(entries: AudioVocabularyItem[]): void {
    this.vocabularyAudio.clear()

    entries?.forEach((entry) => {
      if (!entry?.japanese) {
        return
      }

      if (entry.audioUrls?.length) {
        this.vocabularyAudio.set(entry.japanese, entry)
      } else {
        this.vocabularyAudio.set(entry.japanese, entry)
      }
    })
  }

  handleReplacements(): void {
    // Keep this lightweight and debounced to avoid scanning too often on busy pages.
    if (!this.settings.enabled) {
      return
    }

    if (this.prefetchTimer) {
      window.clearTimeout(this.prefetchTimer)
    }

    this.prefetchTimer = window.setTimeout(() => {
      this.prefetchTimer = null
      void this.scanAndPrefetchAudio()
    }, 250)
  }

  /**
   * Immediately initialize audio features without debouncing.
   * Use this when you know processing is complete and want immediate feature setup.
   */
  initializeFeatures(): void {
    if (!this.settings.enabled) {
      return
    }

    // Prevent excessive calls with a cooldown period
    const now = performance.now()
    if (now - this.lastFeatureInitTime < this.featureInitCooldown) {
      return
    }
    this.lastFeatureInitTime = now

    // Cancel any pending debounced scan
    if (this.prefetchTimer) {
      window.clearTimeout(this.prefetchTimer)
      this.prefetchTimer = null
    }

    // Immediately scan and prefetch audio
    void this.scanAndPrefetchAudio()
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
    }
  }

  /**
   * Explicit cleanup to remove global event listeners.
   */
  dispose(): void {
    document.removeEventListener("click", this.clickListener, true)
    document.removeEventListener("mousemove", this.hoverListener, true)
    this.stop()
  }

  private refreshEventListeners(): void {
    document.removeEventListener("click", this.clickListener, true)
    document.removeEventListener("mousemove", this.hoverListener, true)

    if (!this.settings.enabled) {
      return
    }

    document.addEventListener("click", this.clickListener, true)

    if (this.settings.mode === "hover") {
      document.addEventListener("mousemove", this.hoverListener, true)
    }
  }

  private async scanAndPrefetchAudio(): Promise<void> {
    try {
      const nodes = Array.from(document.getElementsByClassName(__WK_CLASS_REPLACEMENT)) as HTMLElement[]
      if (!nodes.length) {
        return
      }

      const toQueue: string[] = []
      const seen = new Set<string>()

      for (const el of nodes) {
        const text = el.textContent ?? ""
        const word = sanitizeWord(text)
        if (!word || seen.has(word)) continue
        seen.add(word)

        const entry = this.vocabularyAudio.get(word)
        if (!entry?.audioUrls?.length) continue

        for (const url of entry.audioUrls) {
          if (!this.prefetchedUrls.has(url) && !this.audioCache.has(url)) {
            toQueue.push(url)
          }
          break
        }
      }

      this.addToQueue(toQueue)
    } catch (error) {
      log.debug('audio prefetch scan error', error)
    }
  }

  private addToQueue(urls: string[]): void {
    for (const url of urls) {
      if (!this.prefetchQueue.includes(url)) {
        this.prefetchQueue.push(url)
      }
    }

    if (!this.isProcessingQueue && this.prefetchQueue.length > 0) {
      void this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return
    }

    this.isProcessingQueue = true

    try {
      while (this.prefetchQueue.length > 0) {
        const batch = this.prefetchQueue.splice(0, this.maxConcurrentRequests)
        
        const promises = batch.map(async (url, index) => {
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, this.requestDelayMs * index))
          }
          
          try {
            await this.loadAudio(url)
            this.prefetchedUrls.add(url)
          } catch (error) {
            log.warn('audio prefetch failed for url:', url, error)
          }
        })

        await Promise.all(promises)

        if (this.prefetchQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.requestDelayMs * 2))
        }
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    if (!this.settings.enabled) {
      return
    }

    const wordInfo = this.getWordFromEvent(event)
    if (!wordInfo?.word) {
      return
    }

    await this.playWord(wordInfo.word)
  }

  private async handleHover(event: MouseEvent): Promise<void> {
    if (!this.settings.enabled || this.settings.mode !== "hover") {
      return
    }

    const wordInfo = this.getWordFromEvent(event)
    if (!wordInfo?.word) {
      this.lastHoverWord = null
      return
    }

    if (wordInfo.word === this.lastHoverWord) {
      return
    }

    this.lastHoverWord = wordInfo.word

    if (this.hoverTimeout) {
      window.clearTimeout(this.hoverTimeout)
    }

    this.hoverTimeout = window.setTimeout(() => {
      void this.playWord(wordInfo.word)
    }, 120)
  }

  private getWordFromEvent(event: MouseEvent): WordInfo | null {
    const target = event.target as HTMLElement | null

    if (!target || target.closest?.("input, textarea, button, select")) {
      return null
    }

    const replacementElement = target.closest<HTMLElement>(`.${__WK_CLASS_REPLACEMENT}`)
    if (!replacementElement) {
      return null
    }

    const text = replacementElement.textContent ?? ""
    const word = sanitizeWord(text)

    if (!word) {
      return null
    }

    return { word }
  }

  private async playWord(word: string): Promise<void> {
    const sanitized = sanitizeWord(word)

    if (!sanitized) {
      return
    }

    const entry = this.vocabularyAudio.get(sanitized)

    if (entry?.audioUrls?.length) {
      for (const url of entry.audioUrls) {
        try {
          await this.playAudioUrl(url)
          return
        } catch (error) {
          log.warn('failed to play audio', error)
          continue
        }
      }
    }

    if (hasSpeechSynthesis()) {
      this.playWithTts(entry?.reading ?? sanitized)
    }
  }

  private async playAudioUrl(url: string): Promise<void> {
    if (!url) {
      throw new Error(t('audio_error_invalid_url'))
    }

    const cacheEntry = await this.loadAudio(url)

    const audio = cacheEntry.audio
    audio.currentTime = 0
    audio.volume = this.settings.volume
    this.currentAudio = audio
    await audio.play()
  }

  private async loadAudio(url: string): Promise<AudioCacheEntry> {
    const cached = this.audioCache.get(url)
    if (cached) {
      return cached
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const audio = new Audio(objectUrl)
    audio.preload = "auto"
    audio.volume = this.settings.volume

    const entry: AudioCacheEntry = { audio, objectUrl }
    this.audioCache.set(url, entry)
    return entry
  }

  private playWithTts(text: string): void {
    if (!hasSpeechSynthesis()) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "ja-JP"
    utterance.volume = clamp(this.settings.volume)
    window.speechSynthesis.speak(utterance)
  }
}
