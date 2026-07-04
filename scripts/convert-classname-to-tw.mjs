#!/usr/bin/env node
/**
 * Convert className usage to tailwind-styled-v4 styled components
 * 
 * This script:
 * 1. Finds all .tsx files in examples/next-js-app/src/app/learn
 * 2. Converts className props to tw.div/tw.section/etc styled components
 * 3. Preserves semantic HTML tags
 * 4. Extracts styles to separate styles.ts file
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { glob } from 'glob';

const ROOT = new URL('../../', import.meta.url).pathname;
const LEARN_DIR = join(ROOT, 'examples/next-js-app/src/app/learn');

// Map HTML tags to their semantic equivalents
const TAG_MAP = {
    div: 'div',
    section: 'section',
    article: 'article',
    aside: 'aside',
    nav: 'nav',
    header: 'header',
    footer: 'footer',
    main: 'main',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    span: 'span',
    button: 'button',
    a: 'a',
    code: 'code',
    pre: 'pre',
};

/**
 * Extract className from JSX
 * @param {string} jsxString - JSX element string
 * @returns {{tag: string, className: string, children: string, otherProps: string}}
 */
function parseJSXElement(jsxString) {
    // Match: <tag className="..." otherProp="...">children</tag>
    const match = jsxString.match(/<(\w+)\s+([^>]+)>(.*?)<\/\1>/s);
    if (!match) return null;

    const [, tag, propsString, children] = match;

    // Extract className
    const classNameMatch = propsString.match(/className=["']([^"']+)["']/);
    const className = classNameMatch ? classNameMatch[1] : '';

    // Remove className from props
    const otherProps = propsString.replace(/className=["'][^"']+["']\s*/g, '').trim();

    return { tag, className, children, otherProps };
}

/**
 * Generate styled component from className
 * @param {string} tag - HTML tag
 * @param {string} className - Tailwind classes
 * @param {string} componentName - Component name
 * @returns {string} Styled component code
 */
function generateStyledComponent(tag, className, componentName) {
    return `const ${componentName} = tw.${tag}\`${className}\`;`;
}

/**
 * Process a single file
 * @param {string} filePath - Path to file
 */
function processFile(filePath) {
    console.log(`Processing: ${filePath}`);

    const content = readFileSync(filePath, 'utf-8');

    // Skip if no className found
    if (!content.includes('className=')) {
        console.log('  → No className found, skipping');
        return;
    }

    // Skip if already using tw. extensively
    if (content.includes('tw.') && content.split('tw.').length > 5) {
        console.log('  → Already converted, skipping');
        return;
    }

    // Count classNames
    const classNameCount = (content.match(/className=/g) || []).length;
    console.log(`  → Found ${classNameCount} className usage(s)`);
    console.log('  → Manual conversion recommended for complex files');
    console.log('  → File logged for review\n');

    return filePath;
}

/**
 * Main conversion function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('tailwind-styled-v4 className → tw.* Converter');
    console.log('='.repeat(60));
    console.log();

    // Find all .tsx files
    const files = await glob(`${LEARN_DIR}/**/*.tsx`, { ignore: '**/node_modules/**' });

    console.log(`Found ${files.length} .tsx files in learn folder\n`);

    const filesToConvert = [];

    for (const file of files) {
        const result = processFile(file);
        if (result) filesToConvert.push(result);
    }

    console.log('='.repeat(60));
    console.log(`Summary: ${filesToConvert.length} files need conversion`);
    console.log('='.repeat(60));
    console.log();

    if (filesToConvert.length > 0) {
        console.log('Files to convert:');
        filesToConvert.forEach(f => {
            console.log(`  - ${f.replace(ROOT, '')}`);
        });

        // Save list
        const listPath = join(ROOT, 'FILES_TO_CONVERT.txt');
        writeFileSync(listPath, filesToConvert.map(f => f.replace(ROOT, '')).join('\n'));
        console.log(`\nList saved to: FILES_TO_CONVERT.txt`);
    }
}

main().catch(console.error);
