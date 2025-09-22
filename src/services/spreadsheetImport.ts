import { Storage } from "@plasmohq/storage"

import type { SpreadSheet } from "~src/components/settings/SpreadsheetImport/types"
import type { VocabularyEntry } from "~src/services/vocabulary/types"
import { t } from '~src/utils/i18n'

const DATA_STORAGE_KEY = "wanikanify:spreadsheetData"
const HISTORY_STORAGE_KEY = "wanikanify:spreadsheetHistory"

const spreadsheetStorage = new Storage({ area: "local" })

export type SpreadsheetDataset = {
  sheet: SpreadSheet
  entries: VocabularyEntry[]
  updatedAt: string
}

export type SpreadsheetDataMap = Record<string, SpreadsheetDataset>

export type SpreadsheetImportError = {
  row: number
  message: string
}

export type SpreadsheetImportHistoryEntry = {
  id: string
  sheetId: string
  sheet: SpreadSheet
  createdAt: string
  entryCount: number
  errors: SpreadsheetImportError[]
  data: SpreadsheetDataset
}

export type SpreadsheetImportResult = {
  dataset: SpreadsheetDataset
  historyEntry: SpreadsheetImportHistoryEntry
}

const sheetIdentifier = (sheet: SpreadSheet) =>
  `${sheet.collectionKey}::${sheet.spreadSheetName}`

const generateId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2))

const csvLineToCells = (line: string): string[] => {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      const nextChar = line[i + 1]
      if (inQuotes && nextChar === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ""
      continue
    }

    current += char
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

const parseCsv = (csv: string): string[][] => {
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return rows.map(csvLineToCells)
}

const buildSheetUrl = (sheet: SpreadSheet): string => {
  const { collectionKey, spreadSheetName } = sheet
  const encodedSheet = encodeURIComponent(spreadSheetName)
  return `https://docs.google.com/spreadsheets/d/${collectionKey}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}`
}

const normalizeDelimiter = (delimiter?: string) =>
  (delimiter && delimiter.length > 0 ? delimiter : ",")

const normalizeValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const toVocabularyEntries = (
  sheet: SpreadSheet,
  rows: string[][],
  delimiter: string
): {
  entries: VocabularyEntry[]
  errors: SpreadsheetImportError[]
} => {
  const [headerRow, ...dataRows] = rows

  const headerIndex = (name: string) =>
    headerRow.findIndex((header) => header.trim().toLowerCase() === name.trim().toLowerCase())

  const englishIndex = headerIndex(sheet.englishColumn)
  const japaneseIndex = headerIndex(sheet.japaneseColumn)
  const readingIndex = sheet.readingColumn
    ? headerIndex(sheet.readingColumn)
    : -1

  const errors: SpreadsheetImportError[] = []

  if (englishIndex === -1 || japaneseIndex === -1) {
    if (englishIndex === -1) {
      errors.push({ row: 0, message: `Missing English column "${sheet.englishColumn}"` })
    }
    if (japaneseIndex === -1) {
      errors.push({ row: 0, message: `Missing Japanese column "${sheet.japaneseColumn}"` })
    }
    return { entries: [], errors }
  }

  const englishDelimiter = normalizeDelimiter(delimiter)
  const entries: VocabularyEntry[] = []

  dataRows.forEach((row, rowIndex) => {
    const englishCell = normalizeValue(row[englishIndex])
    const japaneseCell = normalizeValue(row[japaneseIndex])
    const readingCell = readingIndex >= 0 ? normalizeValue(row[readingIndex]) : ""

    if (!englishCell || !japaneseCell) {
      errors.push({
        row: rowIndex + 2,
        message: t('spreadsheet_error_missing_pair')
      })
      return
    }

    const englishWords = englishCell
      .split(englishDelimiter)
      .map((word) => word.trim())
      .filter(Boolean)

    if (!englishWords.length) {
      errors.push({
        row: rowIndex + 2,
        message: t('spreadsheet_error_no_valid_english')
      })
      return
    }

    const id = `${sheetIdentifier(sheet)}:${rowIndex}`

    entries.push({
      id,
      english: englishWords,
      japanese: japaneseCell,
      reading: readingCell || undefined,
      source: "imported",
      priority: 1,
      audioUrls: []
    })
  })

  return { entries, errors }
}

export const fetchSpreadsheetCsv = async (
  sheet: SpreadSheet,
  signal?: AbortSignal
): Promise<string> => {
  const url = buildSheetUrl(sheet)
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet (HTTP ${response.status})`)
  }

  return response.text()
}

export const importSpreadsheet = async (
  sheet: SpreadSheet,
  signal?: AbortSignal
): Promise<SpreadsheetImportResult> => {
  const csv = await fetchSpreadsheetCsv(sheet, signal)
  const rows = parseCsv(csv)

  if (!rows.length) {
  throw new Error(t('spreadsheet_error_empty'))
  }

  const { entries, errors } = toVocabularyEntries(sheet, rows, sheet.delimiter)
  const now = new Date().toISOString()
  const id = generateId()
  const sheetId = sheetIdentifier(sheet)

  const dataset: SpreadsheetDataset = {
    sheet,
    entries,
    updatedAt: now
  }

  const historyEntry: SpreadsheetImportHistoryEntry = {
    id,
    sheetId,
    sheet,
    createdAt: now,
    entryCount: entries.length,
    errors,
    data: dataset
  }

  const [existingData, existingHistory] = await Promise.all([
    spreadsheetStorage.get<SpreadsheetDataMap>(DATA_STORAGE_KEY),
    spreadsheetStorage.get<SpreadsheetImportHistoryEntry[]>(HISTORY_STORAGE_KEY)
  ])

  const dataMap: SpreadsheetDataMap = {
    ...(existingData ?? {}),
    [sheetId]: dataset
  }

  const history: SpreadsheetImportHistoryEntry[] = [
    historyEntry,
    ...((existingHistory ?? []).filter((entry) => entry.id !== id))
  ].slice(0, 20)

  await Promise.all([
    spreadsheetStorage.set(DATA_STORAGE_KEY, dataMap),
    spreadsheetStorage.set(HISTORY_STORAGE_KEY, history)
  ])

  return { dataset, historyEntry }
}

export const getSpreadsheetData = async (): Promise<SpreadsheetDataMap> =>
  (await spreadsheetStorage.get<SpreadsheetDataMap>(DATA_STORAGE_KEY)) ?? {}

export const getAggregatedImportedVocabulary = async (): Promise<VocabularyEntry[]> => {
  const data = await getSpreadsheetData()
  return Object.values(data).flatMap((dataset) => dataset.entries ?? [])
}

export const getImportHistory = async (): Promise<SpreadsheetImportHistoryEntry[]> =>
  (await spreadsheetStorage.get<SpreadsheetImportHistoryEntry[]>(HISTORY_STORAGE_KEY)) ?? []


export const deleteHistoryEntry = async (
  id: string
): Promise<SpreadsheetImportHistoryEntry | null> => {
  const history = await getImportHistory()
  const record = history.find((entry) => entry.id === id) ?? null

  if (!record) {
    return null
  }

  const updated = history.filter((entry) => entry.id !== id)

  await spreadsheetStorage.set(HISTORY_STORAGE_KEY, updated)
  await clearSpreadsheetData(record.sheetId)

  return record
}

export const restoreHistoryEntry = async (
  id: string
): Promise<SpreadsheetImportHistoryEntry | null> => {
  const history = await getImportHistory()
  const record = history.find((entry) => entry.id === id)

  if (!record) {
    return null
  }

  const data = await getSpreadsheetData()

  const updatedData: SpreadsheetDataMap = {
    ...data,
    [record.sheetId]: {
      ...record.data,
      updatedAt: new Date().toISOString()
    }
  }

  await spreadsheetStorage.set(DATA_STORAGE_KEY, updatedData)
  return record
}

export const clearSpreadsheetData = async (sheetId: string): Promise<void> => {
  const data = await getSpreadsheetData()
  if (data[sheetId]) {
    delete data[sheetId]
    await spreadsheetStorage.set(DATA_STORAGE_KEY, data)
  }
}

export {
  DATA_STORAGE_KEY as SPREADSHEET_DATA_STORAGE_KEY,
  HISTORY_STORAGE_KEY as SPREADSHEET_HISTORY_STORAGE_KEY
}
