/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
// eslint-disable-next-line import/no-extraneous-dependencies
const { RuleTester } = require('eslint')
const tsParser = require('@typescript-eslint/parser')

// Directly require the rule (CommonJS file)
const rule = require(path.join(process.cwd(), 'eslint-plugin-local-i18n', 'rules', 'hardcoded-ui-string.js'))

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
  }
})

tester.run('hardcoded-ui-string', rule, {
  valid: [
    { code: "t('options_header_title')" },
    { code: "console.log('WaniKanify: cache miss')" },
    { code: "console.warn('[dev] something internal')" },
    { code: "const x = 'translateX(-50%) translateY(-50%)'" },
    { code: "const c = 'wanikanify-tooltip wanikanify-tooltip-before'" },
    { code: "const color = 'rgba(0,0,0,0.5)'" },
    { code: "const f = '1fr 2fr'" },
    { code: "const file = 'types.ts'" },
    { code: "const id = 'OK'" },
    { code: "console.info('DEV: tracing thing')" },
  ],
  invalid: [
    {
      code: "const label = 'Settings'",
      errors: [{ messageId: 'hardcoded' }]
    },
    {
      code: "const phrase = 'This is a user facing sentence.'",
      errors: [{ messageId: 'hardcoded' }]
    }
  ]
})
