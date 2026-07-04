import fs from 'fs';
import path from 'path';

const files = [
  'examples/next-js-app/src/app/learn/mentor/styles.ts',
  'examples/next-js-app/src/app/learn/medium/transitions-animations/styles.ts',
  'examples/next-js-app/src/app/learn/medium/visual-effects/styles.ts',
  'examples/next-js-app/src/app/learn/medium/typography/styles.ts',
  'examples/next-js-app/src/app/learn/medium/selectors-specificity/styles.ts',
  'examples/next-js-app/src/app/learn/medium/custom-properties/styles.ts',
  'examples/next-js-app/src/app/learn/medium/css-architecture/styles.ts',
  'examples/next-js-app/src/app/learn/medium/colors-gradients/styles.ts',
  'examples/next-js-app/src/app/learn/medium/transforms/styles.ts',
  'examples/next-js-app/src/app/learn/advandced/subgrid/styles.ts',
  'examples/next-js-app/src/app/learn/advandced/anchor-positioning/styles.ts',
  'examples/next-js-app/src/app/learn/advandced/view-transitions-advanced/styles.ts',
  'examples/next-js-app/src/app/learn/advandced/container-style-queries/styles.ts',
  'examples/next-js-app/src/app/learn/high/css-performance/styles.ts',
  'examples/next-js-app/src/app/learn/high/accessibility-css/styles.ts',
  'examples/next-js-app/src/app/learn/high/aria-dynamic-theme/styles.ts',
  'examples/next-js-app/src/app/learn/high/advanced-layout-patterns/styles.ts',
  'examples/next-js-app/src/app/learn/high/css-javascript/styles.ts',
  'examples/next-js-app/src/app/learn/high/css-architecture-patterns/styles.ts',
  'examples/next-js-app/src/app/learn/high/houdini/styles.ts',
];

let fixed = 0;

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Not found: ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  // Replace: defaultVariants: { active: "false" } with defaultVariants: { active: false }
  content = content.replace(/defaultVariants:\s*{\s*active:\s*"false"\s*}/g, 'defaultVariants: { active: false }');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n✨ Fixed ${fixed} files`);
