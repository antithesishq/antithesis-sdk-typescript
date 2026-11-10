// Writes src/internal/version.ts from package.json, so the SDK header
// reports the package version as a compile-time literal.
const { readFileSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const root = join(__dirname, '..')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
writeFileSync(
    join(root, 'src', 'internal', 'version.ts'),
    `// Generated from package.json by scripts/write-version.js; do not edit.\n` +
        `export const SDK_VERSION = '${version}'\n`
)
