const Module = require("module")
const path = require("path")

const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith("~src/")) {
    const resolved = path.join(__dirname, "..", "src", request.slice(5))
    return originalResolveFilename.call(this, resolved, parent, ...rest)
  }

  return originalResolveFilename.call(this, request, parent, ...rest)
}

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs" }
})

require("./profile-text-replacer.ts")
