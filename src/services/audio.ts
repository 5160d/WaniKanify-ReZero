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
    // Lazy-load audio for vocabulary that just appeared on the page.
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

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
    }
  }

  /**
   * Explicit cleanup to remove global event listeners. Useful for React unmount scenarios
   * (e.g. options Live Preview component) and for deterministic test teardown.
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
      // Gather visible replacement elements and prefetch audio for the first few unique words
      const nodes = Array.from(document.getElementsByClassName(__WK_CLASS_REPLACEMENT)) as HTMLElement[]
      if (!nodes.length) {
        return
      }

      const toPrefetch: string[] = []
      const seen = new Set<string>()

      for (const el of nodes) {
        const text = el.textContent ?? ""
        const word = sanitizeWord(text)
        if (!word || seen.has(word)) continue
        seen.add(word)

        const entry = this.vocabularyAudio.get(word)
        if (!entry?.audioUrls?.length) continue

        // Take the first URL as primary; we can extend to multiple if needed
        for (const url of entry.audioUrls) {
          if (!this.prefetchedUrls.has(url) && !this.audioCache.has(url)) {
            toPrefetch.push(url)
          }
          // Prefetch only the first viable url to limit bandwidth
          break
        }

        if (toPrefetch.length >= 8) {
          // Cap batch size per scan to avoid flooding network
          break
        }
      }

      // Sequentially prefetch to keep it simple and gentle on the network
      for (const url of toPrefetch) {
        try {
          await this.loadAudio(url)
          this.prefetchedUrls.add(url)
        } catch (error) {
          log.warn('audio prefetch failed', error)
        }
      }
    } catch (error) {
      // Non-fatal: prefetch is opportunistic
      log.debug('audio prefetch scan error', error)
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
