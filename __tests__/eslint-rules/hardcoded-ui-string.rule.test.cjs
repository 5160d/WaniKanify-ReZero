const { RuleTester } = require('eslint')
const path = require('path')
const parser = require('@typescript-eslint/parser')

const rule = require(path.join(process.cwd(), 'eslint-plugin-local-i18n', 'rules', 'hardcoded-ui-string.js'))

const tester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
  }
})

tester.run('hardcoded-ui-string', rule, {
  valid: [
    { code: "t('options_header_title')" },
  { code: "log.debug('[WK] cache miss scenario')" },
    { code: "const x = 'translateX(-50%) translateY(-50%)'" },
    { code: "const c = 'wanikanify-tooltip wanikanify-tooltip-before'" },
    { code: "const color = 'rgba(0,0,0,0.5)'" },
    { code: "const fr = '1fr 2fr'" },
    { code: "const file = 'types.ts'" },
    { code: "const id = 'OK'" },
  { code: "log.info('[WK] tracing thing')" },
    { code: "const dyn = `Value: ${'x'}`" }, // template with expression ignored
    { code: "const css = '0 0 4px rgba(0,0,0,0.3)'" },
    { code: "const transformChain = 'translateX(-50%) translateY(-50%)'" },
    { code: "const attr = 'aria-label'" },
    { code: "const technical = 'wanikanify:refresh-vocabulary'" },
    { code: "const classToken = 'wanikanify-surface'" },
    { code: "const numberUnit = '12px'" },
    { code: "const media = '(prefers-color-scheme: dark)'" },
    { code: "const keyframes = '@keyframes fadeIn'" },
    { code: "const diag = '[WK] internal timing trace'" },
  ],
  invalid: [
    { code: "const label = 'Settings'", errors: [{ messageId: 'hardcoded' }] },
    { code: "const phrase = 'This is a user facing sentence.'", errors: [{ messageId: 'hardcoded' }] },
    { code: "const tmpl = `Simple sentence.`", errors: [{ messageId: 'hardcoded' }] },
    { code: "const sentence = 'Shows replacement tooltips'", errors: [{ messageId: 'hardcoded' }] },
    { code: "const multi = 'Audio volume setting'", errors: [{ messageId: 'hardcoded' }] }
  ]
})
