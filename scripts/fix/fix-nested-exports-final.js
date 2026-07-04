#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const packagesToFix = [
    'packages/domain/compiler',
    'packages/domain/core',
    'packages/domain/engine',
    'packages/domain/plugin',
    'packages/domain/preset',
    'packages/domain/runtime-css',
    'packages/domain/theme',
    'packages/infrastructure/cli',
    'packages/presentation/rspack'
];

function extractSourceFile(distPath) {
    // Convert dist path to src path: dist/foo/index.d.ts → foo/index.ts
    const relativePath = distPath.replace(/^\.\/dist\//, '').replace(/\.d\.ts$/, '.ts');
    return `src/${relativePath}`;
}

function findSourceFile(srcDir, srcPath) {
    const fullPath = path.join(srcDir, srcPath);
    if (fs.existsSync(fullPath)) {
        return srcPath;
    }

    // Try without .ts extension (might be directory with index)
    const indexPath = path.join(srcDir, srcPath.replace('.ts', '/index.ts'));
    if (fs.existsSync(indexPath)) {
        return srcPath.replace('.ts', '/index.ts');
    }

    return null;
}

function generateTsupConfig(entryMap) {
    const entryStr = Object.entries(entryMap)
        .map(([key, val]) => `    ${key}: "${val}"`)
        .join(',\n');

    return `import { defineConfig } from "tsup"

export default defineConfig({
  // Multi-entry support with nested exports
  entry: {
${entryStr}
  },
  format: ["esm", "cjs"],  // ✨ Dual format: ESM + CJS
  dts: true,  // ✨ Modern: native tsup dts generation (now works with all nested entries!)
  clean: true,
  target: "node20",
  platform: "node",
})`;
}

packagesToFix.forEach(pkg => {
    const pkgJsonPath = path.join(pkg, 'package.json');
    const tsupConfigPath = path.join(pkg, 'tsup.config.ts');
    const srcDir = path.join(pkg, 'src');

    if (!fs.existsSync(pkgJsonPath)) {
        console.log(`⏭️  ${pkg}: package.json not found`);
        return;
    }

    try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

        if (!pkgJson.exports || typeof pkgJson.exports !== 'object') {
            console.log(`⏭️  ${pkg}: no exports field`);
            return;
        }

        const entryMap = { index: 'src/index.ts' };
        let foundCount = 0;

        // Process each export (skip the '.' which is the main export)
        Object.entries(pkgJson.exports).forEach(([exportPath, exportConfig]) => {
            if (exportPath === '.' || exportPath === './package.json') {
                return;
            }

            // Get the types path from the export config
            let typesPath;
            if (typeof exportConfig === 'string') {
                typesPath = exportConfig;
            } else if (exportConfig.types) {
                typesPath = exportConfig.types;
            } else if (exportConfig.import) {
                typesPath = exportConfig.import;
            } else {
                return;
            }

            // Convert to source path
            const srcFile = extractSourceFile(typesPath);
            const found = findSourceFile(srcDir, srcFile);

            if (found) {
                const entryName = exportPath.replace(/^\.\/(\.\.\/)*/, '').replace(/\//g, '-');
                entryMap[entryName] = found;
                foundCount++;
            }
        });

        const config = generateTsupConfig(entryMap);
        fs.writeFileSync(tsupConfigPath, config);
        console.log(`✅ ${pkg}: index + ${foundCount} nested exports`);
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
    }
});

console.log('\n✨ All tsup configs updated with correct entry paths!');
