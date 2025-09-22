import React, { useEffect, useMemo, useRef } from "react"
import { Card, CardContent, Stack, Typography } from "@mui/material"
import { t } from '~src/utils/i18n'

import { TextReplacementEngine, type ReplacementResult } from "~src/services/textReplacer"
import { initializeTooltipPositioning, toggleTooltipVisibility } from "~src/services/tooltips"
import { AudioService } from "~src/services/audio"
import type { WaniSettingsFormImpl } from "~src/components/settings/types"
import { parseCustomVocabulary } from "~src/components/settings/CustomVocabulary/utils"
import { __WK_CLASS_REPLACEMENT, __WK_CLASS_TOOLTIPS_DISABLED } from '~src/internal/tokens'

type SettingsPreviewProps = {
  settingsForm: WaniSettingsFormImpl
}

const SAMPLE_TEXTS = [
  t('preview_sample_sentence_1'),
  t('preview_sample_sentence_2'),
  t('preview_sample_sentence_3')
]

const buildVocabularyFromForm = (settingsForm: WaniSettingsFormImpl) => {
  const engine = new TextReplacementEngine()

  const parsedVocabulary = parseCustomVocabulary(settingsForm.customVocabulary)
  const vocabulary = new Map<string, { japanese: string; reading?: string }>()

  parsedVocabulary.forEach((value, key) => {
    vocabulary.set(key, {
      japanese: value.japanese,
      reading: value.reading
    })
  })

  if (!vocabulary.size) {
    vocabulary.set("fox", { japanese: "狐", reading: "きつね" })
    vocabulary.set("library", { japanese: "図書館", reading: "としょかん" })
    vocabulary.set("music", { japanese: "音楽", reading: "おんがく" })
  }

  const blacklist = new Set<string>()
  const blacklistEntries = settingsForm.vocabularyBlacklist
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)

  blacklistEntries.forEach((entry) => blacklist.add(entry))

  engine.updateConfig({
    caseSensitive: false,
    matchWholeWord: true,
    numbersReplacement: settingsForm.numbersReplacement
  })

  engine.setVocabulary(vocabulary, blacklist)

  return engine
}

const NUMBER_REGEX = /\p{N}+/u

const renderPreview = (result: ReplacementResult, numbersReplacement: boolean): React.ReactNode => {
  if (!result.matches.length) {
    if (!numbersReplacement) return result.value
    if (!NUMBER_REGEX.test(result.value)) return result.value
    return result.value.split(/(\p{N}+)/u).map((segment, i) => {
      if (!segment) return null
      if (NUMBER_REGEX.test(segment)) {
        return (
          <span
            key={`num-${i}-${segment}`}
            className={__WK_CLASS_REPLACEMENT}
            data-wanikanify-original={segment}
          >
            {segment}
          </span>
        )
      }
      return segment
    })
  }

  const nodes: React.ReactNode[] = []
  let cursor = 0

  result.matches.forEach((match) => {
    const index = result.value.indexOf(match.replacement, cursor)

    if (index === -1) {
      return
    }

    if (index > cursor) {
      nodes.push(result.value.slice(cursor, index))
    }

    nodes.push(
      <span
        key={`${match.replacement}-${index}-${cursor}`}
        className={__WK_CLASS_REPLACEMENT}
        data-wanikanify-original={match.source ?? match.original}
        data-wanikanify-reading={match.reading ?? ""}
      >
        {match.replacement}
      </span>
    )

    cursor = index + match.replacement.length
  })

  if (cursor < result.value.length) {
    const tail = result.value.slice(cursor)
    if (numbersReplacement && NUMBER_REGEX.test(tail)) {
      const pieces = tail.split(/(\p{N}+)/u)
      pieces.forEach((piece, pi) => {
        if (!piece) return
        if (NUMBER_REGEX.test(piece)) {
          nodes.push(
            <span
              key={`tail-num-${pi}-${piece}`}
              className={__WK_CLASS_REPLACEMENT}
              data-wanikanify-original={piece}
            >
              {piece}
            </span>
          )
        } else {
          nodes.push(piece)
        }
      })
    } else {
      nodes.push(tail)
    }
  }

  return nodes
}

export const SettingsPreview: React.FC<SettingsPreviewProps> = ({ settingsForm }) => {
  const engine = useMemo(() => buildVocabularyFromForm(settingsForm), [settingsForm])
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<AudioService | null>(null)

  // Initialize audio service once
  useEffect(() => {
    audioRef.current = new AudioService()
    return () => {
      // Dispose to remove any global listeners deterministically (important for tests)
      audioRef.current?.dispose()
      audioRef.current = null
    }
  }, [])

  // Update audio settings when form changes
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.updateSettings({
      enabled: settingsForm.audio.enabled,
      mode: settingsForm.audio.mode,
      volume: settingsForm.audio.volume ?? 1
    })
  }, [settingsForm.audio.enabled, settingsForm.audio.mode, settingsForm.audio.volume])

  // Provide vocabulary to audio service for TTS fallback (even without audio URLs)
  useEffect(() => {
    if (!audioRef.current) return
    // Derive simple list from current engine vocabulary by scanning sample results once
    const uniqueJapanese = new Set<string>()
    const entries: { japanese: string; reading?: string; audioUrls?: string[] }[] = []
    SAMPLE_TEXTS.forEach(sample => {
      const r = engine.replace(sample)
      r.matches.forEach(m => {
        if (!m.replacement) return
        if (uniqueJapanese.has(m.replacement)) return
        uniqueJapanese.add(m.replacement)
        entries.push({ japanese: m.replacement, reading: m.reading })
      })
    })
    audioRef.current.setVocabulary(entries)
  }, [engine, settingsForm.customVocabulary, settingsForm.vocabularyBlacklist, settingsForm.numbersReplacement])

  useEffect(() => {
    if (rootRef.current) {
      initializeTooltipPositioning(rootRef.current)
    }
  }, [])

  useEffect(() => {
    if (rootRef.current) {
      toggleTooltipVisibility(rootRef.current, settingsForm.showReplacementTooltips)
    }
  }, [settingsForm.showReplacementTooltips])

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent
        className={
          settingsForm.showReplacementTooltips ? undefined : __WK_CLASS_TOOLTIPS_DISABLED
        }
        ref={rootRef}
      >
        <Stack spacing={2}>
          <Typography variant="h6" color="text.primary">
            {t('preview_heading')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('preview_description')}
          </Typography>

          <Stack spacing={2}>
            {SAMPLE_TEXTS.map((sample, index) => {
              const result = engine.replace(sample)
              return (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'action.hover'
                  }}
                >
                  {renderPreview(result, settingsForm.numbersReplacement)}
                </Typography>
              )
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default SettingsPreview
