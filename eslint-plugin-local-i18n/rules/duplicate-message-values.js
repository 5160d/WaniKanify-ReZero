'use strict'
/**
 * Reports duplicate message values in locales/en/messages.json excluding an allowlist.
 * Runs per file but only needs to execute once; caches result in module scope.
 */
const fs = require('fs')
const path = require('path')

let cachedProblems = null
let globalReported = false // ensures single emission across all files

function loadMessages(rootDir) {
  const file = path.join(rootDir, 'locales', 'en', 'messages.json')
  try {
    const raw = fs.readFileSync(file, 'utf8')
    const json = JSON.parse(raw)
    return json
  } catch (e) {
    return null
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Detect unexpected duplicate localized message values', recommended: false },
    schema: [
      {
        type: 'object',
        properties: {
          allowlist: { type: 'array', items: { type: 'string' } }
        },
        additionalProperties: false
      }
    ],
    messages: {
      duplicate: 'Duplicate localized message value "{{value}}" used by keys: {{keys}}'
    }
  },
  create(context) {
    if (cachedProblems === null) {
      const options = context.options[0] || {}
      const allow = new Set(options.allowlist || [])
      const cwd = context.getCwd ? context.getCwd() : process.cwd()
      const messages = loadMessages(cwd)
      if (messages) {
        const valueMap = new Map()
        for (const [key, obj] of Object.entries(messages)) {
          const val = obj.message
          if (!valueMap.has(val)) valueMap.set(val, [])
          valueMap.get(val).push(key)
        }
        cachedProblems = []
        for (const [val, keys] of valueMap.entries()) {
          // Skip duplicates for pattern/example-centric strings that contain wildcard/caret tokens
          const isPatternExample = /[\*^]/.test(val)
          if (keys.length > 1 && !allow.has(val) && !isPatternExample) {
            cachedProblems.push({ val, keys })
          }
        }
      } else {
        cachedProblems = []
      }
    }

    let reported = false
    return {
      Program(node) {
        if (reported || globalReported) return
        reported = true
        globalReported = true
        for (const p of cachedProblems) {
          context.report({ node, messageId: 'duplicate', data: { value: p.val, keys: p.keys.join(', ') } })
        }
      }
    }
  }
}
