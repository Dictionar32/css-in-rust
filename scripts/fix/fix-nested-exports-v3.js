#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const packagesToFix = [
    {
        pkg: 'packages/domain/compiler',
        exports: ['compiler', 'parser', 'analyzer', 'cache', 'redis', 'watch', 'internal']
    },
    {
        pkg: 'packages/domain/core',
        exports: ['next', 'vite', 'compiler', 'preset', 'css', 'plugins', 'devtools', 'animate', 'theme', 'browser']
    },
    {
        pkg: 'packages/domain/engine',
        exports: ['internal']
    },
    {
        pkg: 'packages/domain/plugin',
        exports: ['plugins', 'presets']
    },
    {
        pkg: 'packages/domain/preset',
        exports: ['default']
    },
    {
        pkg: 'packages/domain/runtime-css',
        exports: ['client', 'server', 'batched']
    },
    {
        pkg: 'packages/domain/theme',
        exports: ['live-tokens']
    },
    {
        pkg: 'packages/infrastructure/cli',
        exports: ['bin']
    },
    {
        pkg: 'packages/presentation/rspack',
        exports: ['loader']
    }
];

function getEntryPath(srcDir, exp) {
    // Try nested directory first: src/{exp}/index.ts
    const nestedPath = path.join(srcDir, exp, 'index.ts');
    if (fs.existsSync(nestedPath)) {
        return `src/${exp}/index.ts`;
    }

    // Then try top-level: src/{exp}.ts
    const topLevelPath = path.join(srcDir, `${exp}.ts`);
    if (fs.existsSync(topLevelPath)) {
        return `src/${exp}.ts`;
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

packagesToFix.forEach(({ pkg, exports: nestedExports }) => {
    const tsupConfigPath = path.join(pkg, 'tsup.config.ts');
    const srcDir = path.join(pkg, 'src');

    try {
        const entryMap = {
            index: 'src/index.ts'
        };

        let foundCount = 0;
        nestedExports.forEach(exp => {
            const entryPath = getEntryPath(srcDir, exp);
            if (entryPath) {
                entryMap[exp] = entryPath;
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
