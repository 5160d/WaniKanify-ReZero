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
