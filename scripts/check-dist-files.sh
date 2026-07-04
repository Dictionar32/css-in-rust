#!/bin/bash

echo "=== Checking dist files for compiler ==="
echo ""
echo "All files in dist:"
ls -1 /home/annas-zen/Documents/css-in-rust/packages/domain/compiler/dist/*.d.* 2>/dev/null | wc -l
echo ""

echo ".d.ts files:"
ls -1 /home/annas-zen/Documents/css-in-rust/packages/domain/compiler/dist/*.d.ts 2>/dev/null | head -20

echo ""
echo ".d.cts files:"
ls -1 /home/annas-zen/Documents/css-in-rust/packages/domain/compiler/dist/*.d.cts 2>/dev/null | head -20

echo ""
echo "=== Checking subdirectories for .d.ts files ==="
find /home/annas-zen/Documents/css-in-rust/packages/domain/compiler/dist -type f -name "*.d.ts" | head -20

echo ""
echo "=== Build verification: All 29 packages ==="
cd /home/annas-zen/Documents/css-in-rust
npm run build:packages --no-daemon 2>&1 | grep -E "^(✔|✓|ERROR|Failed|Tasks:)" | tail -5
