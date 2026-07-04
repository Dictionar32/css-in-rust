#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

function generateDts(pkg) {
    const tsconfigPath = path.join(pkg, 'tsconfig.json');
    const srcIndex = path.join(pkg, 'src', 'index.ts');

    if (!fs.existsSync(srcIndex)) return;

    try {
        // Run tsc with --emitDeclarationOnly to generate .d.ts files
        const result = spawnSync('npx', ['tsc', '--emitDeclarationOnly', '--skipLibCheck'], {
            cwd: pkg,
            stdio: 'pipe'
        });

        if (result.status === 0) {
            console.log(`✅ ${pkg}: .d.ts files generated`);
        } else {
            console.error(`❌ ${pkg}: tsc failed`);
        }
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
    }
}

packagesToFix.forEach(generateDts);
console.log('\n✨ Done!');
