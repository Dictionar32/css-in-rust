#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find all page.tsx files in learn directories
const learnDir = path.join(__dirname, 'examples/next-js-app/src/app/learn');

function findPageFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...findPageFiles(fullPath));
        } else if (item === 'page.tsx') {
            files.push(fullPath);
        }
    }

    return files;
}

const pageFiles = findPageFiles(learnDir);

for (const file of pageFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;

    // Fix pattern: active={condition ? "true" : "false"} → active={condition}
    content = content.replace(/active=\{\s*(.+?)\s*\?\s*"true"\s*:\s*"false"\s*\}/g, 'active={$1}');

    // Fix pattern: active={!condition ? "true" : "false"} → active={!condition}
    // (already covered by above)

    // Fix pattern: active="true" → active={true}
    content = content.replace(/active="true"/g, 'active={true}');

    // Fix pattern: active="false" → active={false}
    content = content.replace(/active="false"/g, 'active={false}');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`✅ Fixed: ${path.relative(__dirname, file)}`);
    }
}

console.log(`\n✨ Fixed ${pageFiles.length} page.tsx files`);
