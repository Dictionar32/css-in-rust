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
    const exts = ['.ts', '.tsx', '.js', '.jsx'];

    for (const ext of exts) {
        const filePath = path.join(srcDir, baseName + ext);
        if (fs.existsSync(filePath)) {
            return `${baseName}${ext}`;
        }
    }

    for (const ext of exts) {
        const indexPath = path.join(srcDir, baseName, `index${ext}`);
        if (fs.existsSync(indexPath)) {
            return `${baseName}/index${ext}`;
        }
    }

    return null;
}

function generateTsupMainConfig(entryMap) {
    const entryStr = Object.entries(entryMap)
        .map(([key, val]) => `    ${key}: "src/${val}"`)
        .join(',\n');

    return `import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
${entryStr}
  },
  format: ["esm", "cjs"],
  dts: false,  // ✨ Disable inline DTS (will use separate pass)
  clean: true,
  target: "node20",
  platform: "node",
})`;
}

function generateTsupDtsConfig(entryMap) {
    const entryStr = Object.entries(entryMap)
        .map(([key, val]) => `    ${key}: "src/${val}"`)
        .join(',\n');

    return `import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
${entryStr}
  },
  dts: {
    only: true  // ✨ Generate .d.ts files ONLY (no JavaScript)
  },
  clean: false,  // Don't clean dist, JS files already there
  target: "node20",
  platform: "node",
})`;
}

function updatePackage(pkg) {
    const pkgJsonPath = path.join(pkg, 'package.json');
    const tsupConfigPath = path.join(pkg, 'tsup.config.ts');
    const tsupDtsConfigPath = path.join(pkg, 'tsup.dts.config.ts');
    const srcDir = path.join(pkg, 'src');

    if (!fs.existsSync(pkgJsonPath)) return false;

    try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

        if (!pkgJson.exports || typeof pkgJson.exports !== 'object') {
            // No nested exports
            const entryMap = {};
            const indexResolved = resolveSourceFile(srcDir, 'index');
            if (indexResolved) entryMap['index'] = indexResolved;

            fs.writeFileSync(tsupConfigPath, generateTsupMainConfig(entryMap));
            fs.writeFileSync(tsupDtsConfigPath, generateTsupDtsConfig(entryMap));
            return true;
        }

        const entryMap = {};
        let foundCount = 0;

        const indexResolved = resolveSourceFile(srcDir, 'index');
        if (indexResolved) {
            entryMap['index'] = indexResolved;
        }

        Object.entries(pkgJson.exports).forEach(([exportPath, exportConfig]) => {
            if (exportPath === '.' || exportPath === './package.json') {
                return;
            }

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

        fs.writeFileSync(tsupConfigPath, generateTsupMainConfig(entryMap));
        fs.writeFileSync(tsupDtsConfigPath, generateTsupDtsConfig(entryMap));

        // Update build script in package.json
        if (!pkgJson.scripts) pkgJson.scripts = {};
        pkgJson.scripts.build = `tsup --config tsup.config.ts && tsup --config tsup.dts.config.ts`;

        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

        console.log(`✅ ${pkg}: Main + DTS configs updated`);
        return true;
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
        return false;
    }
}

packagesToFix.forEach(updatePackage);

console.log('\n✨ All tsup configs split into main + DTS build passes!');
