import type { WaniSettings } from "../types"

export const shouldBackfillSettings = (
  saved: WaniSettings | undefined,
  normalized: WaniSettings
): boolean => Boolean(saved) && normalized.version !== saved.version

