import { shouldBackfillSettings } from "~src/components/settings/utils/backfill"
import type { WaniSettings } from "~src/components/settings/types"
import type { AudioMode } from "~src/components/settings/toggles/types"

const buildSettings = (version: number): WaniSettings => ({
  version,
  apiToken: "token",
  autoRun: false,
  audio: { enabled: false, mode: "click" as AudioMode, volume: 1 },
  showReplacementTooltips: true,
  numbersReplacement: false,
  performanceTelemetry: false,
  srsGroups: { apprentice: true, guru: true, master: true, enlightened: true, burned: true },
  customVocabulary: new Map<string, { japanese: string; reading?: string }>(),
  vocabularyBlacklist: new Set<string>(),
  sitesFiltering: [],
  spreadsheetImport: [],
  siteOverrides: {}
})

describe("shouldBackfillSettings", () => {
  it("returns false when saved settings are undefined", () => {
    const normalized = buildSettings(2)
    expect(shouldBackfillSettings(undefined, normalized)).toBe(false)
  })

  it("returns true when versions differ", () => {
    const saved = buildSettings(1)
    const normalized = buildSettings(2)
    expect(shouldBackfillSettings(saved, normalized)).toBe(true)
  })

  it("returns false when versions match", () => {
    const saved = buildSettings(2)
    const normalized = buildSettings(2)
    expect(shouldBackfillSettings(saved, normalized)).toBe(false)
  })
})
