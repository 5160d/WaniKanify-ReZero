import React, { useMemo } from "react"
import { Card, CardContent, Stack, Typography } from "@mui/material"

import { TextReplacementEngine, type ReplacementResult } from "~src/services/textReplacer"
import type { WaniSettingsFormImpl } from "~src/components/settings/types"
import { parseCustomVocabulary } from "~src/components/settings/CustomVocabulary/utils"

type SettingsPreviewProps = {
  settingsForm: WaniSettingsFormImpl
}

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog while reading a book in the library.",
  "Learning with WaniKanify makes vocabulary practice effortless during daily browsing.",
  "Numbers like 123 or 456 will change when Japanese digits are enabled."
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

const renderPreview = (result: ReplacementResult): React.ReactNode => {
  if (!result.matches.length) {
    return result.value
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
        className="wanikanify-replacement"
        data-wanikanify-original={match.source ?? match.original}
        data-wanikanify-reading={match.reading ?? ""}
      >
        {match.replacement}
      </span>
    )

    cursor = index + match.replacement.length
  })

  if (cursor < result.value.length) {
    nodes.push(result.value.slice(cursor))
  }

  return nodes
}

export const SettingsPreview: React.FC<SettingsPreviewProps> = ({ settingsForm }) => {
  const engine = useMemo(() => buildVocabularyFromForm(settingsForm), [
    settingsForm.customVocabulary,
    settingsForm.vocabularyBlacklist,
    settingsForm.numbersReplacement
  ])

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent
        className={
          settingsForm.showReplacementTooltips ? undefined : "wanikanify-tooltips-disabled"
        }
      >
        <Stack spacing={2}>
          <Typography variant="h6" color="text.primary">
            Live Preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            See how your current configuration affects sample text. Custom vocabulary, blacklist entries, and number replacement rules are applied instantly.
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
                  {renderPreview(result)}
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
