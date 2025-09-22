#!/usr/bin/env node
/**
 * Scans the codebase for usages of localization message keys and reports keys
 * present in locales/en/messages.json (and the generated union) that are never referenced.
 *
 * Detection Strategy:
 * 1. Load keys from locales/en/messages.json
 * 2. Grep-like scan of source files under src/ (ts,tsx) for:
 *      t('key') | t("key") | t(`key`)
 *      __MSG_key__ (Chrome manifest style) – future proof (if used directly anywhere)
 * 3. Dynamic key constructions (variables / concatenation / template expressions) are intentionally ignored; only static literal keys are tracked.
 * 4. Report sorted list of unused keys (exit code 1 if any, else 0) unless --allow-exit-zero passed.
 *
 * Exclusions:
 *  - The key definition file (message-keys.d.ts)
 *  - node_modules, build, dist, coverage, tests fixture data
 *  - Strings inside comments are still matched (simple text scan) which is acceptable; false positives
 *    are mitigated by requiring the precise patterns above.
 *
 * Options:
 *  --json           Output JSON array of unused keys
 *  --allow-exit-zero Always exit 0 even if unused keys found (useful in CI informational mode)
 *  --verbose        Print counts and sample usage lines
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LOCALE_FILE = path.join(ROOT, 'locales', 'en', 'messages.json')
const SRC_DIR = path.join(ROOT, 'src')

function loadKeys() {
  const raw = fs.readFileSync(LOCALE_FILE, 'utf8')
  const json = JSON.parse(raw)
  return Object.keys(json)
}

function walk(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const rel = path.relative(ROOT, full)
    // Skip directories
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (/^(node_modules|build|dist|coverage)$/.test(entry)) continue
      walk(full, fileList)
      continue
    }
    // Only scan source .ts/.tsx/.js/.jsx files (exclude d.ts, test files?)
    if (!/\.(tsx?|jsx?)$/.test(entry)) continue
    if (/\.d\.ts$/.test(entry)) continue
    if (/__tests__/.test(rel)) continue
    fileList.push(full)
  }
  return fileList
}

// Patterns capturing key inside t('...') variants and __MSG_key__ placeholders.
const T_CALL_REGEX = /\bt\(\s*(['"`])([a-z0-9_]+)\1\s*\)/g
const MSG_PLACEHOLDER_REGEX = /__MSG_([a-z0-9_]+)__/g

function collectUsedKeys(files) {
  const used = new Set()
  for (const file of files) {
    let content
    try { content = fs.readFileSync(file, 'utf8') } catch { continue }
    let m
    while ((m = T_CALL_REGEX.exec(content)) !== null) {
      used.add(m[2])
    }
    while ((m = MSG_PLACEHOLDER_REGEX.exec(content)) !== null) {
      used.add(m[1])
    }
  }
  return used
}

function main() {
  const args = process.argv.slice(2)
  const asJson = args.includes('--json')
  const allowExitZero = args.includes('--allow-exit-zero')
  const verbose = args.includes('--verbose')

  if (!fs.existsSync(LOCALE_FILE)) {
    console.error('Locale file missing:', LOCALE_FILE)
    process.exit(2)
  }
  const allKeys = loadKeys()
  const files = walk(SRC_DIR)
  const used = collectUsedKeys(files)
  const unused = allKeys.filter(k => !used.has(k)).sort()

  if (asJson) {
    process.stdout.write(JSON.stringify(unused, null, 2) + '\n')
  } else {
    if (unused.length === 0) {
      console.log('All localization keys are referenced (', allKeys.length, 'keys ).')
    } else {
      console.log('Unused localization keys (' + unused.length + '):')
      for (const key of unused) {
        console.log('  -', key)
      }
    }
    if (verbose) {
      console.log('\nStats:')
      console.log('  Total keys:', allKeys.length)
      console.log('  Used keys :', used.size)
      console.log('  Unused    :', unused.length)
      console.log('  Scanned files:', files.length)
    }
  }

  if (unused.length > 0 && !allowExitZero) {
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
