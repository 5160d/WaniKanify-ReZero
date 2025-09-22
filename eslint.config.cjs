// Flat config for ESLint v9 bridging existing .eslintrc.cjs rules.
const js = require('@eslint/js')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const localI18n = require('./eslint-plugin-local-i18n')

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['build/**', 'node_modules/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2021,
        sourceType: 'module'
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        chrome: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        Audio: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        history: 'readonly',
        structuredClone: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        confirm: 'readonly',
        crypto: 'readonly',
        process: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'local-i18n': localI18n,
      'react-hooks': require('eslint-plugin-react-hooks')
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'local-i18n/hardcoded-ui-string': ['error', {
        allowlist: [
          'Save', 'Delete', 'Volume', 'Import', 'Add', 'Auto Run', 'Filtered Websites',
          'Blacklisted Vocabulary', 'Spreadsheet Import', 'Performance Telemetry', 'WaniKanify Numbers', 'Failed to restore backup'
        ],
        sentinelPrefix: '__WK_',
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
      }],
      'local-i18n/no-unregistered-internal-token': ['error', {
        // Defaults are sufficient; option placeholders documented for future tuning.
        // tokenFilePattern: 'src/internal/tokens\\.ts$',
        // prefixPattern: '^(wanikanify:|wanikanify-)[a-z0-9_-]+$'
      }]
      ,
      // Enforce structured logger usage instead of raw console.* in application code.
      'local-i18n/no-raw-console': ['error', {
        // Accept defaults: tests + scripts allowed. If later we want stricter, set enforceInTests/enforceInScripts.
        allowPattern: []
      }]
    }
  }
]
