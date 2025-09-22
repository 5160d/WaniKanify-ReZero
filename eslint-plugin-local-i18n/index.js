// Local i18n ESLint plugin exporting custom rules
module.exports = {
  rules: {
    'hardcoded-ui-string': require('./rules/hardcoded-ui-string'),
    'duplicate-message-values': require('./rules/duplicate-message-values'),
    'no-unregistered-internal-token': require('./rules/no-unregistered-internal-token'),
    'no-raw-console': require('./rules/no-raw-console')
  }
}
