'use strict'
/**
 * Enforces that internal implementation tokens (event channels, classnames, storage keys, etc.)
 * following the patterns:
 *   wanikanify:[a-z0-9_-]+
 *   wanikanify-[a-z0-9_-]+
 * are ONLY declared in the canonical token registry file (src/internal/tokens.ts) or
 * are referenced via imported constants (which appear to the rule merely as identifiers, not literals).
 *
 * Rationale: Prevent ad-hoc scattering of internal technical strings which undermines
 * sentinel-based linting heuristics and makes future auditing / refactors harder.
 */

const ACCEPT_FILE_REGEX = /src[\\/]+internal[\\/]+tokens\.ts$/
const TOKEN_REGEX = /^(wanikanify:|wanikanify-)[a-z0-9_-]+$/

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Require internal wanikanify:* and wanikanify-* tokens to be centralized in tokens.ts', recommended: false },
    schema: [
      {
        type: 'object',
        properties: {
          tokenFilePattern: { type: 'string' }, // override path regex if desired
          prefixPattern: { type: 'string' } // override token regex if needed
        },
        additionalProperties: false
      }
    ],
    messages: {
      unregistered: 'Internal token "{{text}}" must be declared in src/internal/tokens.ts and referenced via exported constant.'
    }
  },
  create(context) {
    const options = context.options[0] || {}
    const filePattern = options.tokenFilePattern ? new RegExp(options.tokenFilePattern) : ACCEPT_FILE_REGEX
    const tokenPattern = options.prefixPattern ? new RegExp(options.prefixPattern) : TOKEN_REGEX
    const filename = context.getFilename()
    const isTokenFile = filePattern.test(filename)

    function checkLiteral(node, value){
      if (typeof value !== 'string') return
      if (!tokenPattern.test(value)) return
      if (isTokenFile) return // allowed definition site
      context.report({ node, messageId: 'unregistered', data: { text: value } })
    }

    return {
      Literal(node){
        checkLiteral(node, node.value)
      },
      TemplateLiteral(node){
        if (node.expressions && node.expressions.length > 0) return
        const raw = node.quasis.map(q => q.value.cooked || '').join('')
        checkLiteral(node, raw)
      }
    }
  }
}
