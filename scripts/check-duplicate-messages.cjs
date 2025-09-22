#!/usr/bin/env node
/**
 * Detect duplicate message values across locale keys.
 * Some duplicates are intentional (e.g. short generic labels like "Save", "Delete", "Volume").
 * This script prints a report and exits with code 1 if any non-allowlisted duplicates are found.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LOCALE_FILE = path.join(ROOT, 'locales', 'en', 'messages.json')

/**
 * Allowlist of message values that are acceptable to repeat.
 * Rationale: very short or universal terms where forcing unique phrasing would harm clarity.
 */
const ALLOW_VALUE_DUPES = new Set([
  'Save',
  'Delete',
  'Volume',
  'Import',
  'Add',
  'Auto Run',
  'Filtered Websites',
  'Blacklisted Vocabulary',
  'Spreadsheet Import',
  'Performance Telemetry',
  'WaniKanify Numbers',
  'Failed to restore backup'
])

function main() {
  if (!fs.existsSync(LOCALE_FILE)) {
    console.error('Locale file not found:', LOCALE_FILE)
    process.exit(1)
  }
  const json = JSON.parse(fs.readFileSync(LOCALE_FILE, 'utf8'))
  const valueToKeys = new Map()
  for (const [key, meta] of Object.entries(json)) {
    const value = meta?.message
    if (!value) continue
    if (!valueToKeys.has(value)) valueToKeys.set(value, [])
    valueToKeys.get(value).push(key)
  }

  const duplicates = []
  for (const [value, keys] of valueToKeys.entries()) {
    if (keys.length > 1 && !ALLOW_VALUE_DUPES.has(value)) {
      duplicates.push({ value, keys })
    }
  }

  if (duplicates.length === 0) {
    console.log('No unexpected duplicate message values found.')
    return
  }

  console.error('Unexpected duplicate message values detected:')
  for (const dup of duplicates) {
    console.error(`  Value: "${dup.value}" -> keys: ${dup.keys.join(', ')}`)
  }
  console.error('\nEither consolidate keys or add to ALLOW_VALUE_DUPES (with justification).')
  process.exit(1)
}

if (require.main === module) {
  main()
}

module.exports = { main }
