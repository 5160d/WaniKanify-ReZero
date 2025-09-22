/**
 * no-raw-console
 * Forbid direct console.* usage in application source. Enforce using the structured logger in `src/utils/log.ts`.
 *
 * Allowed by default:
 *  - The logger implementation file itself.
 *  - Test files (/.test\.[tj]sx?$/) – tests may intentionally spy on console or assert messages.
 *  - Scripts under /scripts/ (node maintenance scripts) unless "enforceInScripts" option is set true.
 *  - Explicitly allowed patterns (option allowPattern: string | string[] regex patterns against full file path).
 *
 * Options: {
 *   allowPattern?: string | string[]   // Additional regex(es) tested against normalized file path
 *   enforceInTests?: boolean           // If true, also flag console.* in tests (default false)
 *   enforceInScripts?: boolean         // If true, also flag console.* in scripts (default false)
 * }
 */

const PATH_SEP_REGEX = /\\/g

/** Returns posix-ish normalized path for consistent regex matching */
function normalizePath(p) {
  return p.replace(PATH_SEP_REGEX, '/');
}

const DEFAULT_METHODS = ['log', 'warn', 'error', 'info', 'debug', 'trace'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw console.* usage outside approved contexts (use structured logger instead).'
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowPattern: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          enforceInTests: { type: 'boolean' },
          enforceInScripts: { type: 'boolean' }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noRawConsole: 'Avoid raw console.{{method}}; use the structured logger (import { log } from "src/utils/log") instead.'
    }
  },
  create(context) {
    const filename = normalizePath(context.getFilename());

    // Ignore internal generated or unknown paths (eslint sometimes supplies <input>)
    if (filename === '<text>' || filename.startsWith('eslint-')) return {};

    const options = context.options && context.options[0] || {};
    const allowPattern = options.allowPattern ? (Array.isArray(options.allowPattern) ? options.allowPattern : [options.allowPattern]) : [];
    const enforceInTests = !!options.enforceInTests;
    const enforceInScripts = !!options.enforceInScripts;

  // Consider something a test if it's in a __tests__/ directory or ends with .test.(t|j)s(x?)
  const isTestFile = /__tests__\//.test(filename) || /\.test\.[tj]sx?$/.test(filename);
    const isScriptFile = /(^|\/)scripts\//.test(filename);
  const isLoggerImpl = /\/src\/utils\/log\.[tj]s$/.test(filename) || /\/src\/utils\/log\.[tj]sx$/.test(filename);

    // If file matches any allowPattern regex, skip
    if (allowPattern.length && allowPattern.some(r => new RegExp(r).test(filename))) return {};

    // Base allowlist (not enforced)
    if (!isLoggerImpl) {
      if (!enforceInTests && isTestFile) return {};
      if (!enforceInScripts && isScriptFile) return {};
    }

    return {
      MemberExpression(node) {
        if (node.object && node.object.name === 'console') {
          const propertyName = node.property && node.property.name;
            if (DEFAULT_METHODS.includes(propertyName)) {
              context.report({ node, messageId: 'noRawConsole', data: { method: propertyName } });
            }
        }
      },
      CallExpression(node) {
        // Handle direct call style: console('something') - rare but guard
        if (node.callee && node.callee.name === 'console') {
          context.report({ node, messageId: 'noRawConsole', data: { method: 'log' } });
        }
      }
    };
  }
};
