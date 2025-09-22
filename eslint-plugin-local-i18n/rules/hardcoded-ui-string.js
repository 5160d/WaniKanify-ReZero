'use strict'
/**
 * Flags hardcoded UI strings that should use the localization system.
 * Heuristic: string literals in TS/TSX under src/ that contain alphabetic characters,
 * length > 1, not all uppercase (likely constants), not only variable-like, not in allowlist.
 */
const DEFAULT_ALLOWLIST = new Set([
  'OK','Ok','ok','ID','on','off','Yes','No','EN','ms','KB','MB','GB'
])

// TitleCase single-word tokens that are considered technical / brand and should not
// trigger when they appear alone (reduce false positives after TitleCase heuristic).
const TITLECASE_TECH_ALLOW = new Set([
  'React','Chrome','Firefox','WaniKanify','WaniKani','MUI','TypeScript'
])

// Regex patterns for technical / non-UI literals we should ignore.
const TECH_PATTERNS = [
  /^wanikanify:[a-z-]+$/,              // internal channel / event names
  /^[a-zA-Z_]+\.[a-zA-Z_.-]+$/,        // theme palette / module path-ish tokens
  /^(data|aria)-[a-z-]+$/,              // attribute names
  /^[a-zA-Z0-9_-]+\.(ts|tsx|js|jsx|css)$/, // file names
  /^@[a-z-]+\s+keyframes/,                // @keyframes names
  /^(background|transform|opacity|scale|rotate|drop-shadow|translate)[^A-Za-z]*$/, // style value atoms
  /^[-0-9.]+(px|fr|em|rem|s|ms|deg)$/,     // single css unit value
  /^(translate|scale|rotate)\(.+\)$/,     // transform functions
  /^opacity\s[0-9.]+s\sease$/,            // animation/transition value
  /^wanikanify-[a-z-]+$/,                  // wanikanify class tokens
  /^inherit\.(light|contrastText)$/,
  /^text\.(secondary|primary)$/,
  /^background\.[a-zA-Z]+$/,
  /^primary\.(main|light|contrastText)$/,
  /^error\.main$/,
  /^success\.main$/,
  /^neutral\.outlinedBorder$/,
  /^(rgba?|hsla?)\(/,                 // color functions
  /^[#.&:]/,                           // starts with CSS selector punctuation
  /^@keyframes\s+[a-zA-Z0-9_-]+$/,     // keyframes declarations
  /^(?:[a-z-]+\s+){0,2}@keyframes\s+[a-zA-Z0-9_-]+$/, // variant keyframes
  /^(translate|translateX|translateY|scale|rotate|skew|matrix)\([^)]*\)(\s+(translate|translateX|translateY|scale|rotate|skew|matrix)\([^)]*\))*$/, // transform chain incl X/Y
  /^[0-9.]+\s?[a-z%]+\s[0-9.]+\s?[a-z%]+\s[0-9.]+\s?[a-z%]+\srgba?\([^)]*\)$/, // box-shadow pattern
  /^drop-shadow\((?:[^()]*|\([^()]*\))*\)$/,          // single drop-shadow filter allowing nested parens (e.g., rgba())
  /^0\s0\s[0-9.]+px\srgba?\([^)]*\)$/, // simple shadow
  /^(?:-?\d+px\s){2}\d+px\srgba?\([^)]*\)$/, // generic shadow triple distances + rgba
  /^tooltipPulse\s[0-9.]+s\s(infinite|linear|ease|ease-in|ease-out|ease-in-out)$/, // animation shorthand
  /^(background-color|transform|opacity)\s[0-9.]+s\s(ease|linear|ease-in|ease-out|ease-in-out)$/, // transition timing
  /^[0-9.]+fr(\s[0-9.]+fr)+$/,        // grid template columns like 1fr 2fr
  /^[0-9.]+px\ssolid(\srgba?\([^)]*\))?$/, // border spec
  /^\(prefers-color-scheme:.*\)$/,   // media query prefers-color-scheme
  /^(input|textarea|button|select)(,\s*(input|textarea|button|select))+$/, // selector list of form controls
  /^wanikanify-tooltip\swanikanify-tooltip-(before|after)$/, // tooltip class lists
  /^wanikanify-tooltip\swanikanify-tooltip-before$/, // explicit tooltip class list variant
  /^noopener noreferrer$/,            // rel attribute tokens
  /^speechSynthesis$/,
  /^ja-JP$/,
  /^translateX\(-?\d+%?\)\stranslateY\(-?\d+%?\)$/i, // translateX/translateY combo
  /^translateX\(-?50%\)\stranslateY\(-?50%\)$/, // common centering translate combo
  /^0\s4px\s20px\srgba?\([^)]*\)$/i, // specific shadow values
  /^Received 304 but no stale value cached$/, // diagnostic
  /^\(subjects incremental empty delta\)$/, // diagnostic
  /^Extension context invalidated$/, // diagnostic
  /^wanikanify:[a-zA-Z0-9_-]+$/, // internal storage keys
  /^drop-shadow\(0 0 8px rgba\([^)]*\)\)$/, // specific drop-shadow style with nested rgba()
  /^Receiving end does not exist$/,
  /[\/\\]/,                          // contains path separators
  /[{}<>$]/,                           // code-y characters
  // Single identifiers: we will ignore purely lower_snake / kebab / camel tokens, but NOT TitleCase words
  /^(?:[a-z0-9_-]+|[a-z]+[a-z0-9]*|[a-z]+[A-Z][A-Za-z0-9]+)$/, // technical-ish identifiers (exclude standalone TitleCase like "Settings")
  /^[A-Z0-9_]+$/,                      // CONSTANT_STYLE
  /^[a-z0-9_]+$/                       // variable_name
]

function isTechnicalToken(str){
  return TECH_PATTERNS.some(r=>r.test(str))
}

function isLikelyUIString(str) {
  if (!/[a-zA-Z]/.test(str)) return false
  const trimmed = str.trim()
  if (trimmed.length < 3) return false
  if (/^https?:\/\//.test(trimmed)) return false
  if (isTechnicalToken(trimmed)) return false
  // If it's a single TitleCase word (e.g., "Settings", "Options", "Vocabulary") we treat it as UI text
  if (/^[A-Z][a-z]+$/.test(trimmed)) {
    if (TITLECASE_TECH_ALLOW.has(trimmed)) return false
    return true
  }
  // Natural language heuristic: at least one space OR ends with sentence punctuation OR contains an ellipsis
  const hasSpace = /\s/.test(trimmed)
  const sentenceLike = /[.!?…]$/.test(trimmed)
  if (!hasSpace && !sentenceLike) return false
  // Avoid CSS values (units / transform chains) unless they look like real text
  if (/(px|%|em|rem|deg|s)\b/.test(trimmed) && !/[A-Za-z]{4,}/.test(trimmed.replace(/(px|%|em|rem|deg|s)/g,''))) return false
  return true
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded UI strings in source; use t(key) instead',
      recommended: false
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowlist: { type: 'array', items: { type: 'string' } },
          ignoreFiles: { type: 'array', items: { type: 'string' } },
          sentinelPrefix: { type: 'string' }
        },
        additionalProperties: false
      }
    ],
    messages: {
      hardcoded: 'Hardcoded UI string "{{text}}" – add to locales and reference via t(key).'
    }
  },
  create(context) {
    const options = context.options[0] || {}
    const allowlist = new Set([...(options.allowlist || []), ...DEFAULT_ALLOWLIST])
    const ignoreFileGlobs = (options.ignoreFiles || []).map(s => new RegExp(s))
    const filename = context.getFilename()
    if (ignoreFileGlobs.some(r => r.test(filename))) {
      return {}
    }
    const sentinelPrefix = typeof options.sentinelPrefix === 'string' && options.sentinelPrefix.length > 0
      ? options.sentinelPrefix
      : null

    function isConsoleOnly(node) {
      if (!node.parent || node.parent.type !== 'CallExpression') return false
      const call = node.parent
      const callee = call.callee
      // console.* direct
      if (callee && callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'console') {
        return true
      }
      // log.* where log is imported logger util
      if (callee && callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && /^(log|logger)$/.test(callee.object.name)) {
        return true
      }
      return false
    }

    // Developer log diagnostic prefix
    const DEV_LOG_PREFIX = '[WK]' // structured logger diagnostic prefix

    function isDevLogString(str) {
      return str.startsWith(DEV_LOG_PREFIX)
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return
        const text = node.value.trim()
        if (!text) return
        if (sentinelPrefix && text.startsWith(sentinelPrefix)) return
        if (allowlist.has(text)) return
        if (isConsoleOnly(node)) return // developer-only console/log output ignored
        if (isDevLogString(text)) return // explicitly marked dev log
        if (!isLikelyUIString(text)) return
        // Skip if inside a call expression already using t('...')
        if (node.parent && node.parent.type === 'CallExpression') {
          const callee = node.parent.callee && (node.parent.callee.type === 'Identifier' ? node.parent.callee.name : null)
          if (callee === 't') return
        }
        context.report({ node, messageId: 'hardcoded', data: { text } })
      },
      TemplateLiteral(node) {
        if (node.expressions && node.expressions.length > 0) return // dynamic template; skip
        const raw = node.quasis.map(q => q.value.cooked || '').join('').trim()
        if (!raw) return
        if (sentinelPrefix && raw.startsWith(sentinelPrefix)) return
        if (allowlist.has(raw)) return
        if (isDevLogString(raw)) return
        if (!isLikelyUIString(raw)) return
        if (node.parent && node.parent.type === 'CallExpression') {
          const callee = node.parent.callee && node.parent.callee.type === 'Identifier' ? node.parent.callee.name : null
          if (callee === 't') return
        }
        context.report({ node, messageId: 'hardcoded', data: { text: raw } })
      }
    }
  }
}
