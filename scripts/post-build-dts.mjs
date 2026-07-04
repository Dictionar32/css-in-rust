#!/usr/bin/env node
/**
 * Post-build: Generate .d.ts files for all packages
 * 
 * tsup's native dts: true has limitations with multi-entry builds.
 * This script runs tsc --emitDeclarationOnly on each package after
 * the main build to generate missing type definitions.
 */

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const packages = [
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

console.log('📦 Post-build: Generating .d.ts files...\n');

packages.forEach(pkg => {
    try {
        process.chdir(pkg);
        console.log(`  📝 ${pkg}...`);

        execSync('npx tsc --emitDeclarationOnly --skipLibCheck', {
            stdio: 'inherit'
        });

        console.log(`     ✅ Done\n`);
        process.chdir('../../..');
    } catch (err) {
        console.log(`     ⚠️  tsc completed with warnings/errors\n`);
        process.chdir('../../..');
    }
});

console.log('✨ All packages processed!');
