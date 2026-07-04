# Silent Failures & Output Capture Strategy

## Problem

**Silent failures** terjadi ketika:
- Command exit dengan error code (1, 2, etc.) tapi tidak ada output
- Terminal commands return tanpa pesan error yang berguna
- Build/test failures tidak menampilkan root cause
- Debugging menjadi impossible tanpa akses ke actual error messages

## Solution: Always Capture Output

Ketika menghadapi silent failures atau expected information tidak terlihat:

### Pattern 1: Save to File for Analysis

```bash
# WRONG - Silent, tidak tahu apa errornya
npm run build 2>&1

# RIGHT - Capture dan simpan untuk analysis
npm run build > /tmp/build-output.txt 2>&1
echo "Exit code: $?" >> /tmp/build-output.txt

# Atau gunakan -o untuk output file
command > output.txt 2>&1

# Atau tee untuk both stdout dan file
command 2>&1 | tee output.txt
```

### Pattern 2: Redirect Both Streams

```bash
# Capture both stdout dan stderr
command > output.txt 2>&1

# Same but cleaner syntax
command &> output.txt

# Pipe to tee untuk live viewing + file saving
command 2>&1 | tee /tmp/debug.txt
```

### Pattern 3: Verbose Flags

```bash
# Try verbose/debug modes
npm run build --verbose
npm run build --debug
npm run build --no-silent

# TypeScript diagnostics
npx tsc --noEmit --listFiles 2>&1 | tee ts-diag.txt
npx tsc --noEmit --diagnostics 2>&1 | tee ts-full-diag.txt

# Node.js
node --trace-warnings script.js 2>&1 | tee node-trace.txt
```

## Implementation Strategy

### For Build/Test Failures

**When a command fails silently:**

1. **First attempt**: Run with verbose flag + capture
```bash
cd <package>
npm run build --verbose > build-debug.txt 2>&1
# Check build-debug.txt for real errors
```

2. **Second attempt**: Run TypeScript check separately
```bash
npx tsc --noEmit > ts-errors.txt 2>&1
# Shows compilation errors explicitly
```

3. **Third attempt**: Check source files directly
```bash
# Look for import errors, missing files
find src -name "*.ts" -type f | head -20
cat src/index.ts | head -50
```

4. **Save findings**: Document in .txt file
```bash
echo "Package: @tailwind-styled/runtime" > investigation.txt
echo "Build failed silently with exit code 1" >> investigation.txt
echo "" >> investigation.txt
echo "=== TypeScript Diagnostics ===" >> investigation.txt
npx tsc --noEmit >> investigation.txt 2>&1
echo "" >> investigation.txt
echo "=== Entry Files ===" >> investigation.txt
ls -la src/ >> investigation.txt 2>&1
```

### For Package Build Orchestration (Turbo)

```bash
# Run with verbose output capture
npm run build:packages > turbo-build-full.txt 2>&1

# Show which packages failed
grep "ERROR" turbo-build-full.txt > turbo-errors.txt

# Extract per-package logs
grep "@tailwind-styled/runtime" turbo-build-full.txt > runtime-log.txt
```

## File Naming Convention

Store debug output with clear naming:

```
# For immediate debug
./<package>-build-debug.txt          # Latest build attempt
./<package>-ts-diag.txt              # TypeScript diagnostics
./<package>-investigation.txt        # Multi-step investigation

# For turbo/monorepo builds
./turbo-build-full.txt               # Complete turbo output
./turbo-errors.txt                   # Filtered errors only
./turbo-by-package/<name>.txt        # Per-package logs

# For CI/automation
./build-output-<timestamp>.txt       # Timestamped for history
./test-failures-<date>.txt
./lint-report-<date>.txt
```

## Checklist: Silent Failure Protocol

When a command exits with error but no output visible:

- [ ] Run with `> output.txt 2>&1` to capture
- [ ] Try adding `--verbose` or `--debug` flag
- [ ] Redirect to file if both not work
- [ ] Save output to `.txt` file with descriptive name
- [ ] Read saved file for actual error messages
- [ ] Don't assume — always verify output
- [ ] For CI: always capture logs to artifacts

## Examples in This Project

### Build Failures (No Output)

```bash
# PROBLEM
cd packages/domain/runtime
npm run build  # Exit 1, no message

# SOLUTION
npm run build > runtime-build-debug.txt 2>&1
cat runtime-build-debug.txt
# Now see the actual error
```

### TypeScript Check Failures

```bash
# PROBLEM
npx tsc --noEmit  # Exit 2, no message

# SOLUTION
npx tsc --noEmit > ts-check-results.txt 2>&1
cat ts-check-results.txt
# See actual type errors
```

### Turbo Build Failures

```bash
# PROBLEM
npm run build:packages  # Multiple packages fail, hard to track

# SOLUTION
npm run build:packages > turbo-full-build.txt 2>&1
grep "ERROR" turbo-full-build.txt | head -20
grep "@tailwind-styled/theme" turbo-full-build.txt > theme-section.txt
```

## Why This Matters

**Without output capture:**
- Debugging is impossible
- Errors are hidden
- Same problem investigated multiple times
- No audit trail for CI/automation

**With output capture:**
- Can analyze offline
- Reference actual error messages
- Identify patterns
- Build reliable debugging workflow

## Integration with Error Handling Steering

Combined with `.kiro/steering/error-handling.md`:

1. **Error Handling** says: Fail explicitly, don't suppress
2. **Silent Failures** says: When they DO happen, capture & analyze
3. **Together**: Proper error messages + saved logs = debuggable system

## Tools & Commands Reference

### Capture Patterns

```bash
# Basic redirect
command > file.txt 2>&1

# Append (don't overwrite)
command >> file.txt 2>&1

# With timestamp
command > "debug-$(date +%Y%m%d-%H%M%S).txt" 2>&1

# Live viewing + file
command 2>&1 | tee debug.txt

# Head of output only (for large outputs)
command 2>&1 | head -50 | tee first-50.txt

# Tail for last errors
command 2>&1 | tail -100 | tee last-errors.txt
```

### Analysis After Capture

```bash
# Count error lines
grep -c "ERROR" file.txt

# Show unique errors
grep "ERROR" file.txt | sort | uniq

# Get context around error
grep -A 5 -B 5 "ERROR" file.txt

# Filter by package
grep "@tailwind-styled/runtime" file.txt | head -20
```

## Related Documentation

- Error Handling: `.kiro/steering/error-handling.md`
- Tech Stack: `.kiro/steering/tech.md`
- Build System: `.kiro/steering/tech.md#Build Tools`

## Version

- **Created**: July 3, 2026
- **Status**: Active
- **Applies to**: All build, test, and diagnostic commands in css-in-rust
- **Priority**: High (enables debugging of all other issues)

---

**Key Takeaway:**
*Jangan hanya jalankan command dan expect output. Jika ada error atau no output, capture semuanya ke .txt file. Silent failures adalah debugging nightmare — output capture adalah solution.*
