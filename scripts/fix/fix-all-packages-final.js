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

function resolveSourceFile(srcDir, baseName) {
    // Try .ts, .tsx, .js, .jsx, then index versions
    const exts = ['.ts', '.tsx', '.js', '.jsx'];

    for (const ext of exts) {
        const filePath = path.join(srcDir, baseName + ext);
        if (fs.existsSync(filePath)) {
            return `${baseName}${ext}`;
        }
    }

    // Try nested index
    for (const ext of exts) {
        const indexPath = path.join(srcDir, baseName, `index${ext}`);
        if (fs.existsSync(indexPath)) {
            return `${baseName}/index${ext}`;
        }
    }

    return null;
}

function generateTsupConfig(entryMap) {
    const entryStr = Object.entries(entryMap)
        .map(([key, val]) => `    ${key}: "src/${val}"`)
        .join(',\n');

    return `import { defineConfig } from "tsup"

export default defineConfig({
  // Multi-entry support with nested exports
  entry: {
${entryStr}
  },
  format: ["esm", "cjs"],  // ✨ Dual format: ESM + CJS
  dts: true,  // ✨ Modern: native tsup dts generation
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
            // No nested exports, keep default
            const config = generateTsupConfig({ index: 'index.ts' });
            fs.writeFileSync(tsupConfigPath, config);
            console.log(`✅ ${pkg}: default (no nested exports)`);
            return;
        }

        const entryMap = {};
        let foundCount = 0;

        // Always add index
        const indexResolved = resolveSourceFile(srcDir, 'index');
        if (indexResolved) {
            entryMap['index'] = indexResolved;
        }

        // Process each export (skip the '.' which is the main export and ./package.json)
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

            // Extract base filename from dist path
            // dist/batchedInjector.d.ts → batchedInjector
            // dist/cache/index.d.ts → cache (will resolve to cache/index.ts)
            const match = typesPath.match(/dist\/(.+?)(?:\.d\.ts|\.d\.cts)?$/);
            if (!match) return;

            const fileName = match[1];
            const resolved = resolveSourceFile(srcDir, fileName);

            if (resolved) {
                const entryName = exportPath.replace(/^\.\//, '').replace(/\//g, '-');
                entryMap[entryName] = resolved;
                foundCount++;
            }
        });

        const config = generateTsupConfig(entryMap);
        fs.writeFileSync(tsupConfigPath, config);
        console.log(`✅ ${pkg}: ${Object.keys(entryMap).length} entries (${foundCount} nested)`);
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
    }
});

console.log('\n✨ All tsup configs updated!');
