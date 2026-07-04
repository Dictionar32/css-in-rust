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

function generateSimpleConfig(entryMap) {
    const entryStr = Object.entries(entryMap)
        .map(([key, val]) => `    ${key}: "src/${val}"`)
        .join(',\n');

    return `import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
${entryStr}
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
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

        const entryMap = {};

        // Always add index
        const indexResolved = resolveSourceFile(srcDir, 'index');
        if (indexResolved) {
            entryMap['index'] = indexResolved;
        }

        // Process exports
        if (pkgJson.exports && typeof pkgJson.exports === 'object') {
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
                }
            });
        }

        const config = generateSimpleConfig(entryMap);
        fs.writeFileSync(tsupConfigPath, config);

        // Remove DTS config if it exists
        if (fs.existsSync(tsupDtsConfigPath)) {
            fs.unlinkSync(tsupDtsConfigPath);
        }

        // Reset build script to single command
        if (!pkgJson.scripts) pkgJson.scripts = {};
        pkgJson.scripts.build = `tsup`;

        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

        console.log(`✅ ${pkg}: Single tsup config with dts: true`);
        return true;
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
        return false;
    }
}

packagesToFix.forEach(updatePackage);

console.log('\n✨ All tsup configs simplified to single build pass with dts: true!');
