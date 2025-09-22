/**
 * Ensures the generated message-keys.d.ts is in sync with messages.json.
 * If this test fails, run: npm run i18n:gen
 */
import fs from 'fs'
import path from 'path'

describe('i18n message keys sync', () => {
  const root = path.join(__dirname, '..')
  const localePath = path.join(root, 'locales', 'en', 'messages.json')
  const outputPath = path.join(root, 'src', 'locales', 'message-keys.d.ts')

  it('message-keys.d.ts matches messages.json keys', () => {
    const messagesRaw = fs.readFileSync(localePath, 'utf8')
    const messages = JSON.parse(messagesRaw) as Record<string, unknown>
    const keys = Object.keys(messages).sort((a, b) => a.localeCompare(b))
    const expectedLines = keys.map(k => `  | "${k}"`)
    const fileContent = fs.readFileSync(outputPath, 'utf8')
    for (const line of expectedLines) {
      expect(fileContent).toContain(line)
    }
    // Also ensure counts match (simple heuristic)
    const unionLineCount = fileContent.split('\n').filter(l => l.trim().startsWith('| "') || l.trim().startsWith('| \"')).length
    expect(unionLineCount).toBe(keys.length)
  })
})
