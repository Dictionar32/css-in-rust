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

packagesToFix.forEach(pkg => {
    const dtsConfigPath = path.join(pkg, 'tsup.dts.config.ts');

    if (!fs.existsSync(dtsConfigPath)) return;

    let config = fs.readFileSync(dtsConfigPath, 'utf-8');

    // Replace the dts object syntax with simple boolean
    config = config.replace(/dts:\s*\{\s*only:\s*true\s*\}/g, 'dts: true');

    // Add format: [] if not present
    if (!config.includes('format:')) {
        config = config.replace(/dts: true,/, 'dts: true,\n  format: [],  // No JavaScript output (only .d.ts)');
    }

    fs.writeFileSync(dtsConfigPath, config);
    console.log(`✅ ${pkg}: DTS config syntax fixed`);
});

console.log('\n✨ All DTS configs updated!');
