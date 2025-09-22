const { RuleTester } = require('eslint')
const path = require('path')
const parser = require('@typescript-eslint/parser')

const rule = require(path.join(process.cwd(), 'eslint-plugin-local-i18n', 'rules', 'duplicate-message-values.js'))

// This rule looks at messages.json content; to simulate, we'll create a virtual file import.
// For simplicity, we mock context by providing code referencing t() calls is not necessary;
// the rule processes messages.json via filesystem—so we only need a placeholder TS file.

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaVersion: 2020, sourceType: 'module' } }
})

tester.run('duplicate-message-values', rule, {
  valid: [
    { filename: 'src/dummy.ts', code: 'const a = 1' }
  ],
  invalid: [] // detection occurs once; this harness mainly ensures rule loads without crashing.
})
