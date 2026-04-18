const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')

if (!fs.existsSync(distDir)) {
  console.log('Dist directory not found')
  process.exit(0)
}

const files = fs.readdirSync(distDir).filter(f => (f.endsWith('.js') || f.endsWith('.mjs')) && !f.endsWith('.map'))

files.forEach(file => {
  const filePath = path.join(distDir, file)
  let content = fs.readFileSync(filePath, 'utf8')

  let modified = false

  // Match the exact __require wrapper pattern
  const wrapperRegex = /var __require = \/\* @__PURE__ \*\/ \(\(x\) => typeof require !== "undefined" \? require : typeof Proxy !== "undefined" \? new Proxy\(x, \{[\s\S]*?\}\) : x\)\(function\(x\) \{[\s\S]*?\}\);[\s]*/
  
  if (wrapperRegex.test(content)) {
    content = content.replace(wrapperRegex, '')
    modified = true
    console.log(`Removed __require wrapper from ${file}`)
  }

  // Replace __require() calls with require()
  const requireCalls = /__require\(/g
  if (requireCalls.test(content)) {
    content = content.replace(requireCalls, 'require(')
    modified = true
    console.log(`Replaced __require() calls in ${file}`)
  }

  // Replace __require.resolve() calls with require.resolve()
  const requireResolve = /__require\.resolve\(/g
  if (requireResolve.test(content)) {
    content = content.replace(requireResolve, 'require.resolve(')
    modified = true
    console.log(`Replaced __require.resolve() calls in ${file}`)
  }

  // Replace typeof __require !== "undefined" patterns
  const typeOfRequire = /typeof __require !== "undefined"\? __require/g
  if (typeOfRequire.test(content)) {
    content = content.replace(typeOfRequire, 'typeof require !== "undefined" ? require')
    modified = true
    console.log(`Replaced typeof __require patterns in ${file}`)
  }

  // Replace return __require; (direct variable references)
  const returnRequire = /return __require;/g
  if (returnRequire.test(content)) {
    content = content.replace(returnRequire, 'return require;')
    modified = true
    console.log(`Replaced return __require patterns in ${file}`)
  }

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`Saved ${file}`)
  } else {
    console.log(`No changes in ${file}`)
  }
})

console.log('Done')