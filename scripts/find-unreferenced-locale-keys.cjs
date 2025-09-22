#!/usr/bin/env node
/**
 * Scans the codebase for usages of localization message keys and reports keys
 * present in locales/en/messages.json (and the generated union) that are never referenced.
 *
 * Detection Strategy:
 * 1. Load keys from locales/en/messages.json
 * 2. Grep-like scan of source files under src/ (ts,tsx) for (and optionally test files):
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
 *  --json                   Output JSON array of unused keys
 *  --allow-exit-zero         Always exit 0 even if unused keys found (useful in CI informational mode)
 *  --verbose                Print counts and sample usage lines
 *  --dynamic-keys-file <p>  Provide a newline-delimited list of keys that are used indirectly (runtime dynamic / passed via variables)
 *                            These keys will be treated as referenced. Lines starting with # are ignored.
 *  --include-tests          Count test file references (under __tests__/ and *.test.*) as usage (default: true)
 *  --exclude-tests          Force ignoring test files (overrides --include-tests) – useful for classifying test-only keys
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LOCALE_FILE = path.join(ROOT, 'locales', 'en', 'messages.json')
const SRC_DIR = path.join(ROOT, 'src')
const ROOT_PACKAGE_JSON = path.join(ROOT, 'package.json') // capture manifest __MSG_* usages

function loadKeys() {
  const raw = fs.readFileSync(LOCALE_FILE, 'utf8')
  const json = JSON.parse(raw)
  return Object.keys(json)
}

function walk(dir, fileList = [], { includeTests }) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const rel = path.relative(ROOT, full)
    // Skip directories
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (/^(node_modules|build|dist|coverage)$/.test(entry)) continue
      walk(full, fileList, { includeTests })
      continue
    }
    // Only scan source .ts/.tsx/.js/.jsx files (exclude d.ts, test files?)
    if (!/\.(tsx?|jsx?)$/.test(entry)) continue
    if (/\.d\.ts$/.test(entry)) continue
    const isTest = /__tests__/.test(rel) || /\.test\.(t|j)sx?$/.test(entry)
    if (!includeTests && isTest) continue
    fileList.push(full)
  }
  return fileList
}

// Patterns capturing key inside t('...') (optionally with trailing args) and __MSG_key__ placeholders.
// Accepts: t('key'), t("key"), t(`key`), t('key', {...}), t('key' , anything)
const T_CALL_REGEX = /\bt\(\s*(['"`])([a-z0-9_]+)\1\s*(?:[,)]?)/g
const MSG_PLACEHOLDER_REGEX = /__MSG_([a-z0-9_]+)__/g

function collectUsedKeys(files, extraContent = [], debug = false) {
  const used = new Set()
  const matchSamples = new Map()
  const blobs = []
  for (const file of files) {
    try { blobs.push({ file, content: fs.readFileSync(file, 'utf8') }) } catch { /* ignore */ }
  }
  extraContent.forEach(ec => blobs.push({ file: '<extra>', content: ec }))
  for (const { file, content } of blobs) {
    let m
    while ((m = T_CALL_REGEX.exec(content)) !== null) {
      used.add(m[2])
      if (debug) {
        const arr = matchSamples.get(m[2]) || []
        if (arr.length < 3) arr.push(file)
        matchSamples.set(m[2], arr)
      }
    }
    while ((m = MSG_PLACEHOLDER_REGEX.exec(content)) !== null) {
      used.add(m[1])
      if (debug) {
        const arr = matchSamples.get(m[1]) || []
        if (arr.length < 3) arr.push(file)
        matchSamples.set(m[1], arr)
      }
    }
  }
  return { used, matchSamples }
}

function main() {
  const args = process.argv.slice(2)
  const asJson = args.includes('--json')
  const allowExitZero = args.includes('--allow-exit-zero')
  const verbose = args.includes('--verbose')
  const dynIdx = args.indexOf('--dynamic-keys-file')
  const includeTests = args.includes('--exclude-tests') ? false : true // default include
  if (args.includes('--include-tests')) {
    // explicit but redundant; kept for symmetry
  }
  let dynamicKeys = new Set()
  if (dynIdx !== -1 && args[dynIdx + 1]) {
    const dynPath = path.resolve(process.cwd(), args[dynIdx + 1])
    if (fs.existsSync(dynPath)) {
      const lines = fs.readFileSync(dynPath, 'utf8').split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
      dynamicKeys = new Set(lines)
    } else {
      console.error('Dynamic keys file not found:', dynPath)
      process.exit(2)
    }
  } else {
    // Implicit default: look for scripts/i18n-dynamic-keys.txt so callers do not
    // need to always pass --dynamic-keys-file. Keeps docs simpler.
    const defaultDynPath = path.join(ROOT, 'scripts', 'i18n-dynamic-keys.txt')
    if (fs.existsSync(defaultDynPath)) {
      try {
        const lines = fs.readFileSync(defaultDynPath, 'utf8').split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'))
        dynamicKeys = new Set(lines)
      } catch {/* ignore read errors */}
    }
  }

  if (!fs.existsSync(LOCALE_FILE)) {
    console.error('Locale file missing:', LOCALE_FILE)
    process.exit(2)
  }
  const allKeys = loadKeys()
  const files = walk(SRC_DIR, [], { includeTests })
  // Extra content: package.json (manifest __MSG_ references) if present
  const extra = []
  if (fs.existsSync(ROOT_PACKAGE_JSON)) {
    try { extra.push(fs.readFileSync(ROOT_PACKAGE_JSON, 'utf8')) } catch { /* ignore */ }
  }
  const debugUsage = args.includes('--debug-usage')
  const { used, matchSamples } = collectUsedKeys(files, extra, debugUsage)
  // Merge dynamic keys
  for (const k of dynamicKeys) used.add(k)
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
  console.log('  Included tests:', includeTests)
      if (dynamicKeys.size) {
        console.log('  Dynamic allowlisted keys:', dynamicKeys.size)
      }
      if (debugUsage) {
        console.log('\n  Sample matches:')
        for (const k of Object.keys(Object.fromEntries(matchSamples))) {
          const samples = matchSamples.get(k) || []
            console.log('   -', k, samples.length ? '=> '+samples.join(', ') : '')
        }
      }
    }
  }

  if (unused.length > 0 && !allowExitZero) {
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
