#!/bin/bash
set -e

echo "=== Diagnostic Build Script ==="
echo "Date: $(date)"
echo ""

echo "=== Testing Compiler Package Build ==="
cd /home/annas-zen/Documents/css-in-rust/packages/domain/compiler
echo "Working directory: $(pwd)"
echo "Running: npm run build"
npm run build > /tmp/compiler-build.log 2>&1
COMPILER_EXIT=$?
echo "Exit code: $COMPILER_EXIT"
echo ""
echo "=== First 50 lines of build log ==="
head -50 /tmp/compiler-build.log
echo ""
echo "=== Last 50 lines of build log ==="
tail -50 /tmp/compiler-build.log
echo ""

echo "=== Checking dist output ==="
if [ -d dist ]; then
  echo "✓ dist/ directory exists"
  ls -la dist/ | head -20
else
  echo "✗ dist/ directory does NOT exist"
fi
echo ""

echo "=== Testing Theme Package Build ==="
cd /home/annas-zen/Documents/css-in-rust/packages/domain/theme
echo "Working directory: $(pwd)"
npm run build > /tmp/theme-build.log 2>&1
THEME_EXIT=$?
echo "Exit code: $THEME_EXIT"
echo ""
echo "=== Theme Build Log (last 50 lines) ==="
tail -50 /tmp/theme-build.log
echo ""

echo "=== Testing Full turbo build ==="
cd /home/annas-zen/Documents/css-in-rust
npm run build:packages --no-daemon > /tmp/turbo-build.log 2>&1
TURBO_EXIT=$?
echo "Exit code: $TURBO_EXIT"
echo ""
echo "=== Turbo Build Summary (last 80 lines) ==="
tail -80 /tmp/turbo-build.log
