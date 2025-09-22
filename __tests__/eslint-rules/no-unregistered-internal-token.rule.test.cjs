const { RuleTester } = require('eslint')
const path = require('path')
const parser = require('@typescript-eslint/parser')

const rule = require(path.join(process.cwd(), 'eslint-plugin-local-i18n', 'rules', 'no-unregistered-internal-token.js'))

const tester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
  }
})

// We simulate being outside the tokens file by default (RuleTester supplies a filename internally).
// Provide filename overrides for cases.

tester.run('no-unregistered-internal-token', rule, {
  valid: [
    { code: "const x = SOME_TOKEN", filename: 'src/feature/example.ts' }, // identifier usage is fine
    { code: "const evt = `wanikanify:something-${'dyn'}`", filename: 'src/feature/example.ts' }, // dynamic template ignored
    { code: "const c = 'wanikanify-tooltip-before'", filename: 'src/internal/tokens.ts' }, // allowed in token registry
    { code: "const k = 'wanikanify:internal-event'", filename: 'src/internal/tokens.ts' }
  ],
  invalid: [
    { code: "const bad = 'wanikanify:rogue-event'", filename: 'src/feature/example.ts', errors: [{ messageId: 'unregistered' }] },
    { code: "const cls = 'wanikanify-rogue-class'", filename: 'src/components/x.ts', errors: [{ messageId: 'unregistered' }] },
    { code: "const raw = `wanikanify-standalone`", filename: 'src/other/y.ts', errors: [{ messageId: 'unregistered' }] }
  ]
})
