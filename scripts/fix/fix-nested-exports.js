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
        const exportPath = exp.replace(/\//g, '-'); // Handle nested paths like live-tokens
        entries[exportPath] = `src/${exp}.ts`;
    });

    const entryConfig = JSON.stringify(entries, null, 4)
        .replace(/"/g, "'")
        .replace(/'/g, '"');

    return `import { defineConfig } from "tsup"

export default defineConfig({
  // Multi-entry support with nested exports
  entry: ${entryConfig.replace(/\n/g, '\n  ')},
  format: ["esm", "cjs"],  // ✨ Dual format: ESM + CJS
  dts: true,  // ✨ Modern: native tsup dts generation (now works with all nested entries!)
  clean: true,
  target: "node20",
  platform: "node",
})`;
}

packagesToFix.forEach(({ pkg, exports: nestedExports }) => {
    const tsupConfigPath = path.join(pkg, 'tsup.config.ts');

    try {
        // Check if source files exist
        const srcDir = path.join(pkg, 'src');
        let validExports = [];

        nestedExports.forEach(exp => {
            const filePath = path.join(srcDir, `${exp}.ts`);
            if (fs.existsSync(filePath)) {
                validExports.push(exp);
            }
        });

        // Generate config with valid exports only
        const config = generateTsupConfig(validExports);
        fs.writeFileSync(tsupConfigPath, config);
        console.log(`✅ ${pkg}: Updated tsup.config.ts with ${validExports.length} nested exports`);
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
    }
});

console.log('\n✨ All tsup configs updated for nested exports!');
