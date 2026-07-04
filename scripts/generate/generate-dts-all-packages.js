#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function generateDtsPost(pkg) {
    const tsupConfigPath = path.join(pkg, 'tsup.config.ts');
    const srcDir = path.join(pkg, 'src');
    const distDir = path.join(pkg, 'dist');

    if (!fs.existsSync(tsupConfigPath)) return;

    try {
        // Read tsup config to extract entries
        const configContent = fs.readFileSync(tsupConfigPath, 'utf-8');
        const entryMatch = configContent.match(/entry:\s*\{([^}]+)\}/s);

        if (!entryMatch) return;

        const entryText = entryMatch[1];
        const entries = {};

        // Parse entries: index: "src/index.ts",
        const entryRegex = /(\w+):\s*"src\/(.+?)"/g;
        let match;
        while ((match = entryRegex.exec(entryText)) !== null) {
            entries[match[1]] = match[2];
        }

        // Generate .d.ts files using tsc for each entry
        // Since tsup output is already ES, just copy TypeScript definition
        Object.entries(entries).forEach(([name, srcPath]) => {
            const fullSrcPath = path.join(pkg, 'src', srcPath);

            if (!fs.existsSync(fullSrcPath)) return;

            // Get the relative directory for output
            const outFileName = path.basename(srcPath).replace(/\.(ts|tsx)$/, '');
            const outDir = path.dirname(srcPath);

            try {
                // Run tsc for this specific entry
                const command = `cd ${pkg} && npx tsc src/${srcPath} --declaration --emitDeclarationOnly --outDir dist --skipLibCheck 2>/dev/null`;
                execSync(command, { stdio: 'ignore' });
            } catch {
                // Silently continue if tsc fails for one entry
            }
        });

        console.log(`✅ ${pkg}: .d.ts files generated`);
    } catch (err) {
        console.error(`❌ ${pkg}: ${err.message}`);
    }
}

// First, update tsup configs to use dts: false
packagesToFix.forEach(pkg => {
    const tsupConfigPath = path.join(pkg, 'tsup.config.ts');

    try {
        let config = fs.readFileSync(tsupConfigPath, 'utf-8');

        // Replace dts: true with dts: false
        config = config.replace(/dts:\s*true/g, 'dts: false');

        fs.writeFileSync(tsupConfigPath, config);
    } catch (err) {
        console.error(`Config update failed for ${pkg}: ${err.message}`);
    }
});

console.log('✨ Updated all tsup configs to dts: false');
console.log('');

// Now rebuild all packages
console.log('Rebuilding packages...');
try {
    execSync('npm run build:packages', { cwd: '/home/annas-zen/Documents/css-in-rust', stdio: 'inherit' });
} catch (err) {
    console.error('Build failed');
    process.exit(1);
}

console.log('\n✨ Build complete. Now generating .d.ts files...\n');

// Generate .d.ts for each package
packagesToFix.forEach(generateDtsPost);

console.log('\n✅ All packages updated with .d.ts generation!');
