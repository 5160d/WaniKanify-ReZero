#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const srcDir = path.join(root, '_locales')
const buildDir = path.join(root, 'build', 'chrome-mv3-dev', '_locales')

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

function runOnce() {
  copyRecursive(srcDir, buildDir)
  console.log(`[locales] Copied locales to ${buildDir}`)
}

runOnce()

if (process.argv.includes('--watch')) {
  console.log('[locales] Watching for locale changes...')
  fs.watch(srcDir, { recursive: true }, (evt, filename) => {
    if (!filename) return
    runOnce()
  })
}
