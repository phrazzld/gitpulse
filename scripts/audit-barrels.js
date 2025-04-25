/**
 * Audit Barrel Files
 * This script scans all index.ts files and identifies those that contain more than just re-exports.
 * Pure barrel files only re-export from other modules and don't contain executable logic.
 * Logic-containing barrels have executable code and should be included in test coverage.
 */
const fs = require('fs')
const path = require('path')
const glob = require('glob')

// This regex matches pure export statements (both `export * from` and named exports)
const PURE_EXPORT_REGEX =
  /^(\s*(export\s+\*\s+from|export\s+\{\s*.*\s*\}\s+from)\s+['"].+['"];?\s*|\/\/.*|\/\*[\s\S]*?\*\/|\s*)*$/m

// This regex matches simple constant declarations that aren't complex logic
const SIMPLE_CONST_REGEX = /export\s+const\s+\w+\s*=\s*(['"][^'"]*['"]|\d+|true|false);?/g

console.log('Auditing barrel files (index.ts) for executable logic...\n')

glob('src/**/index.ts', (err, files) => {
  if (err) {
    console.error('Error scanning files:', err)
    process.exit(1)
  }

  if (files.length === 0) {
    console.log('No barrel files found.')
    process.exit(0)
  }

  console.log('=== BARREL FILES AUDIT RESULTS ===')
  console.log('Format: [TYPE] FILE_PATH (REASON)')
  console.log('---------------------------------------')

  // Track both types for summary
  const pureBArrels = []
  const logicBarrels = []

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8').trim()

    // Check if it's a pure re-export file
    const isPure = PURE_EXPORT_REGEX.test(content)

    // Check for simple constants (still considered pure)
    const hasSimpleConsts = content.match(SIMPLE_CONST_REGEX)

    // Remove comments, imports, exports and simple constants to see if anything else remains
    let strippedContent = content
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/import\s+.*?from\s+['"].*?['"];?/g, '') // Remove imports
      .replace(/export\s+\*\s+from\s+['"].*?['"];?/g, '') // Remove re-exports
      .replace(/export\s+\{\s*.*?\s*\}\s+from\s+['"].*?['"];?/g, '') // Remove named re-exports
      .replace(SIMPLE_CONST_REGEX, '') // Remove simple constants
      .trim()

    const hasOtherCode = strippedContent.length > 0

    if (isPure && !hasOtherCode) {
      console.log(`[PURE ] ${file} (Only contains re-exports)`)
      pureBArrels.push(file)
    } else if (hasSimpleConsts && !hasOtherCode) {
      console.log(`[PURE ] ${file} (Contains only re-exports and simple constants)`)
      pureBArrels.push(file)
    } else {
      console.log(`[LOGIC] ${file} (Contains executable logic)`)
      logicBarrels.push(file)
    }
  })

  console.log('---------------------------------------')
  console.log(`SUMMARY: ${files.length} total barrel files`)
  console.log(`- ${pureBArrels.length} pure barrels (safe to exclude from coverage)`)
  console.log(`- ${logicBarrels.length} logic-containing barrels (must be included in coverage)`)

  console.log('\n=== COVERAGE EXCLUSION PATTERNS ===')
  pureBArrels.forEach(file => {
    // Create the pattern for jest.config.js
    const pattern = `'!${file}',`
    console.log(pattern)
  })
})
