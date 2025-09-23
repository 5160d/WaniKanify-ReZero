/* ESLint configuration for WaniKanify ReZero */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'local-i18n'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true
  },
  rules: {
    // Security hardening: forbid eval-like and HTML injection primitives in shipped code
    'no-eval': 'error',
    'no-new-func': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[property.name='innerHTML']",
        message: 'Avoid innerHTML; use textContent or DOM APIs to construct elements.'
      },
      {
        selector: "MemberExpression[property.name='outerHTML']",
        message: 'Avoid outerHTML; use DOM APIs to manipulate elements.'
      },
      {
        selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
        message: 'Avoid insertAdjacentHTML; use DOM APIs instead.'
      },
      {
        selector: "CallExpression[callee.name='document.write']",
        message: 'Avoid document.write(); this is unsafe and blocked in extensions.'
      }
    ],
    'local-i18n/hardcoded-ui-string': ['error', {
      allowlist: [
        // Mirror intentional inline allowed UI words; expand as needed.
        'Save', 'Delete', 'Volume', 'Import', 'Add', 'Auto Run', 'Filtered Websites',
        'Blacklisted Vocabulary', 'Spreadsheet Import', 'Performance Telemetry', 'WaniKanify Numbers', 'Failed to restore backup'
      ],
      ignoreFiles: [
        '.*__tests__.*',
        '.*scripts/.*',
        '.*locales.*'
      ]
    }],
    'local-i18n/duplicate-message-values': ['error', {
      allowlist: [
        'Save', 'Delete', 'Volume', 'Import', 'Add', 'Auto Run', 'Filtered Websites',
        'Blacklisted Vocabulary', 'Spreadsheet Import', 'Performance Telemetry', 'WaniKanify Numbers', 'Failed to restore backup'
      ]
    }]
  }
}
