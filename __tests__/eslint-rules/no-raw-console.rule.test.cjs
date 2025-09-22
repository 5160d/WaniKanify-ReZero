const { RuleTester } = require('eslint');
const path = require('path');

const rule = require('../../eslint-plugin-local-i18n/rules/no-raw-console');

// Use a TS parser to align with project usage
const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
});

ruleTester.run('no-raw-console', rule, {
  valid: [
    { code: "import { log } from '../src/utils/log'; log.info('hi')" },
    { code: "console.log('allowed in test');", filename: 'foo.test.ts' },
    { code: "console.error('allowed in scripts by default');", filename: 'scripts/build.cjs' },
    { code: "console.warn('explicit allow pattern');", filename: 'custom/ok/path.ts', options: [{ allowPattern: 'custom/ok/' }] },
    { code: "// not console usage\nconst consoleLike = { log() {} }; consoleLike.log('ok');" },
    { code: "console.log('enforced in tests override');", filename: 'bar.test.ts', options: [{ enforceInTests: false }] },
  ],
  invalid: [
    {
      code: "console.log('direct usage')",
      errors: [{ messageId: 'noRawConsole' }]
    },
    {
      code: "function x(){ console.error('oops'); }",
      errors: [{ messageId: 'noRawConsole' }]
    },
    {
      code: "console.debug('dbg')",
      errors: [{ messageId: 'noRawConsole' }]
    },
    {
      code: "console.trace('trace')",
      errors: [{ messageId: 'noRawConsole' }]
    },
    {
      code: "console.info('test disallowed');",
      filename: 'baz.test.ts',
      options: [{ enforceInTests: true }],
      errors: [{ messageId: 'noRawConsole' }]
    },
    {
      code: "console.warn('script disallowed');",
      filename: 'scripts/run.cjs',
      options: [{ enforceInScripts: true }],
      errors: [{ messageId: 'noRawConsole' }]
    }
  ]
});
