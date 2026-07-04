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

function generateTsupConfig(entryExports) {
    const entries = {
        index: 'src/index.ts'
    };

    // Add nested export entries
    entryExports.forEach(exp => {
        const entryName = exp.replace(/\//g, '-'); // Handle nested paths
        // Try both: src/{exp}.ts (top-level) and src/{exp}/index.ts (nested)
        entries[entryName] = `src/${exp}.ts`;
    });

    const entryStr = Object.entries(entries)
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
        let validExports = [];

        nestedExports.forEach(exp => {
            // Check for src/{exp}.ts (top-level)
            const topLevelPath = path.join(srcDir, `${exp}.ts`);
            // Check for src/{exp}/index.ts (nested directory)
            const nestedPath = path.join(srcDir, exp, 'index.ts');

            if (fs.existsSync(topLevelPath) || fs.existsSync(nestedPath)) {
                validExports.push(exp);
            }
        });

        const config = generateTsupConfig(validExports);
        fs.writeFileSync(tsupConfigPath, config);
        console.log(`✅ ${pkg}: ${validExports.length} entries [${validExports.join(', ')}]`);
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
    }
});

console.log('\n✨ All tsup configs updated!');
