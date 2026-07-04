# Scanner Output Capture — Static File (Non-Realtime)

**Status**: ✅ SIMPLE & STRAIGHTFORWARD  
**What**: Capture scanner output to static files (not realtime dashboard)  
**Files Created**: 2 new capture scripts  

---

## Quick Summary

**Problem**: Scanner output only shows in terminal (scrolls away, hard to track)

**Solution**: Capture output to static files for reading later

**Current Output**:
```bash
$ npm run dev
[scanner] cache HIT /src/proxy.ts
[scanner] cache HIT /src/hooks/useTheme.ts
[scanner] cache MISS /src/app/page.tsx
(scrolls away...)
```

**After Capture**:
```bash
$ ./dev-with-scanner-capture.sh
✅ Capture completed!

📁 Files created:
  .next/tw-classes/scanner-output.txt    (all output)
  .next/tw-classes/scanner-output.jsonl  (scanner events only)
  .next/tw-classes/scanner-summary.txt   (statistics)
```

---

## How to Use

### Option 1: Bash Script (Easiest)

```bash
cd examples/next-js-app

# Make executable
chmod +x dev-with-scanner-capture.sh

# Run with capture
./dev-with-scanner-capture.sh
```

Output files created:
- `.next/tw-classes/scanner-output.txt` — All terminal output
- `.next/tw-classes/scanner-output.jsonl` — Scanner events (JSON Lines format)
- `.next/tw-classes/scanner-summary.txt` — Statistics summary

### Option 2: Manual Redirect

```bash
cd examples/next-js-app

# Redirect stdout + stderr to file
npm run dev > scanner-output.log 2>&1

# Or with tee to see AND save
npm run dev 2>&1 | tee scanner-output.log
```

### Option 3: Node.js Script

```bash
cd examples/next-js-app

# Use the Node.js capture script
npm run dev 2>&1 | node capture-scanner-output.mjs
```

---

## Files Created

### 1. Bash Script
**File**: `examples/next-js-app/dev-with-scanner-capture.sh`

What it does:
- ✅ Starts dev server
- ✅ Captures all output to `.next/tw-classes/scanner-output.txt`
- ✅ Filters scanner events to `.next/tw-classes/scanner-output.jsonl`
- ✅ Calculates statistics (hits, misses, hit rate)
- ✅ Creates summary file
- ✅ Prints colored output to console (still visible!)

**Usage**:
```bash
chmod +x dev-with-scanner-capture.sh
./dev-with-scanner-capture.sh
```

### 2. Node.js Script
**File**: `examples/next-js-app/capture-scanner-output.mjs`

What it does:
- ✅ Reads stdin from `npm run dev 2>&1`
- ✅ Parses each line
- ✅ Tracks statistics in memory
- ✅ Writes to text and JSON files
- ✅ Creates summary on exit

**Usage**:
```bash
npm run dev 2>&1 | node capture-scanner-output.mjs
```

---

## Output Files

### 1. `scanner-output.txt`
**All output** from dev server (everything you see in terminal)

```
▲ Next.js 16.2.4 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://10.91.104.42:3000
✓ Ready in 386ms
[scanner] cache HIT /src/proxy.ts
[scanner] cache HIT /src/hooks/useTheme.ts
[scanner] cache HIT /src/components/Alert.tsx
[scanner] cache MISS /src/app/learn/dasar-css/box-model/page.tsx
[scanner] [native] using native parser from ...
```

### 2. `scanner-output.jsonl`
**Scanner events only** (JSON Lines format, one JSON per line)

```json
{"timestamp":"2026-07-04T14:35:22.123Z","type":"hit","message":"[scanner] cache HIT","file":"/src/proxy.ts"}
{"timestamp":"2026-07-04T14:35:23.123Z","type":"hit","message":"[scanner] cache HIT","file":"/src/hooks/useTheme.ts"}
{"timestamp":"2026-07-04T14:35:24.123Z","type":"miss","message":"[scanner] cache MISS","file":"/src/app/page.tsx"}
```

### 3. `scanner-summary.txt`
**Statistics and metadata**

```
================================================================================
SCANNER OUTPUT CAPTURE SUMMARY
================================================================================

Session:
  Start Time:       2026-07-04T14:35:22+00:00
  End Time:         2026-07-04T14:35:40+00:00
  Duration:         18s

Statistics:
  Total Lines:      1243
  Scanner Events:   57
  Cache Hits:       54
  Cache Misses:     3
  Native Events:    1
  
  Hit Rate:         94.7%

Output Files:
  Text:    .next/tw-classes/scanner-output.txt
  JSON:    .next/tw-classes/scanner-output.jsonl
  Summary: .next/tw-classes/scanner-summary.txt
```

---

## Reading the Output

### View Text Output
```bash
cat .next/tw-classes/scanner-output.txt
```

### View Scanner Events Only
```bash
cat .next/tw-classes/scanner-output.jsonl
```

### Count Hits
```bash
grep "cache HIT" .next/tw-classes/scanner-output.txt | wc -l
```

### Count Misses
```bash
grep "cache MISS" .next/tw-classes/scanner-output.txt | wc -l
```

### Pretty-print JSON
```bash
cat .next/tw-classes/scanner-output.jsonl | jq '.'
```

### Filter by Type
```bash
# Only misses
grep "cache MISS" .next/tw-classes/scanner-output.jsonl

# Only native events
grep "native" .next/tw-classes/scanner-output.txt
```

---

## Data Captured

### Each Scanner Event Includes:
```json
{
  "timestamp": "2026-07-04T14:35:22.123Z",  // When it happened
  "type": "hit",                            // hit, miss, native, error, info
  "message": "[scanner] cache HIT",         // Full log message
  "file": "/src/proxy.ts"                   // File path (if present)
}
```

### Bash Script Also Shows:
```
[HIT] [scanner] cache HIT /src/proxy.ts
[MISS] [scanner] cache MISS /src/app/page.tsx
[NATIVE] [scanner] [native] using native parser...
```

(Colored output so you can see it in real-time!)

---

## Workflow

### Step 1: Start Capture
```bash
cd examples/next-js-app
./dev-with-scanner-capture.sh
```

**Output**:
```
🚀 Starting dev server with scanner output capture...
📁 Output files:
   Text: .next/tw-classes/scanner-output.txt
   JSON: .next/tw-classes/scanner-output.jsonl
   Summary: .next/tw-classes/scanner-summary.txt

▲ Next.js 16.2.4 (Turbopack)
- Local: http://localhost:3000
✓ Ready in 386ms
[HIT] [scanner] cache HIT /src/proxy.ts
[HIT] [scanner] cache HIT /src/hooks/useTheme.ts
[MISS] [scanner] cache MISS /src/app/page.tsx
...
```

### Step 2: Let Dev Server Run
Dev server runs normally. All output is captured + shown in console.

### Step 3: Stop (Ctrl+C)
```
✅ Capture completed!

📊 Summary:
  Total Lines: 1243
  Scanner Events: 57
  Cache Hits: 54
  Cache Misses: 3
  Hit Rate: 94.7%

📁 Files created:
  Text:    .next/tw-classes/scanner-output.txt
  JSON:    .next/tw-classes/scanner-output.jsonl
  Summary: .next/tw-classes/scanner-summary.txt
```

### Step 4: Read Files
```bash
# View summary
cat .next/tw-classes/scanner-summary.txt

# View all events
cat .next/tw-classes/scanner-output.jsonl

# Analyze
grep "cache MISS" .next/tw-classes/scanner-output.txt
```

---

## Comparison: Realtime vs Static

| Aspect | Realtime Dashboard | Static File Capture |
|--------|---|---|
| **Setup** | Complex (React + API) | Simple (bash/node) |
| **Live Updates** | Yes (every 2s) | No (written once) |
| **Real Data** | Needs integration | Automatic |
| **File Size** | ~ | Small (text) |
| **Accessibility** | Browser | Any text editor |
| **Portability** | URL only | File (can email, git) |
| **Analysis** | UI buttons | Terminal/scripts |
| **Storage** | RAM → File (optional) | File → Permanent |
| **Use Case** | Live monitoring | Documentation |

---

## Advantages

✅ **Simple**: Just redirect output to file  
✅ **No Infrastructure**: No web UI needed  
✅ **Permanent**: Can save, version control, share  
✅ **Analysable**: Text format, grep/awk friendly  
✅ **Structured**: JSON Lines for parsing  
✅ **Still Realtime**: Can watch with `tail -f`  
✅ **Portable**: Send to teammates via file  
✅ **Historical**: Keep multiple sessions  

---

## Advanced Usage

### Watch Output in Real-Time
```bash
# Terminal 1: Start capture
./dev-with-scanner-capture.sh

# Terminal 2: Watch scanner events as they come
tail -f .next/tw-classes/scanner-output.jsonl | jq '.'
```

### Export to CSV
```bash
cat .next/tw-classes/scanner-output.jsonl | \
  jq -r '[.timestamp, .type, .file] | @csv' > scanner.csv
```

### Calculate Statistics
```bash
cat .next/tw-classes/scanner-output.jsonl | \
  jq -r '.type' | sort | uniq -c
```

### Find Problematic Files (Many Misses)
```bash
grep "cache MISS" .next/tw-classes/scanner-output.jsonl | \
  jq -r '.file' | sort | uniq -c | sort -rn
```

### Generate Report
```bash
#!/bin/bash
echo "Scanner Analysis Report"
echo "======================"
echo "Total Events: $(cat scanner-output.jsonl | wc -l)"
echo "Cache Hits: $(grep '"hit"' scanner-output.jsonl | wc -l)"
echo "Cache Misses: $(grep '"miss"' scanner-output.jsonl | wc -l)"
echo "Hit Rate: $(($(grep '"hit"' scanner-output.jsonl | wc -l) * 100 / $(cat scanner-output.jsonl | wc -l)))%"
```

---

## File Locations

```
examples/next-js-app/
├── dev-with-scanner-capture.sh    ← Bash script
├── capture-scanner-output.mjs       ← Node.js script
│
└── .next/tw-classes/               ← Output directory (created automatically)
    ├── scanner-output.txt           ← Full output
    ├── scanner-output.jsonl         ← Scanner events (JSON)
    └── scanner-summary.txt          ← Summary + stats
```

---

## Examples

### Example 1: View Summary After Session
```bash
$ cat .next/tw-classes/scanner-summary.txt

================================================================================
SCANNER OUTPUT CAPTURE SUMMARY
================================================================================

Statistics:
  Total Lines:      1243
  Scanner Events:   57
  Cache Hits:       54
  Cache Misses:     3
  Hit Rate:         94.7%
```

### Example 2: Find Why Page X Has Miss
```bash
$ grep "page.tsx" .next/tw-classes/scanner-output.txt
[scanner] cache MISS /src/app/learn/dasar-css/box-model/page.tsx
```

### Example 3: Compare Multiple Sessions
```bash
# Save current session
cp .next/tw-classes/scanner-output.jsonl scanner-session-1.jsonl

# ... make some changes ...

# Run again
./dev-with-scanner-capture.sh

# Compare
diff scanner-session-1.jsonl .next/tw-classes/scanner-output.jsonl
```

---

## Troubleshooting

### Files Not Created
Check that directory exists:
```bash
mkdir -p examples/next-js-app/.next/tw-classes
```

### Permission Denied
```bash
chmod +x dev-with-scanner-capture.sh
```

### No Output
Make sure output is redirected:
```bash
# Wrong
npm run dev

# Right
./dev-with-scanner-capture.sh
# or
npm run dev 2>&1 | tee scanner-output.log
```

### Want to Append to Existing File
```bash
npm run dev 2>&1 >> scanner-output.log
```

---

## When to Use

✅ **Use Static Capture When**:
- You want to archive scanner output
- You need to send logs to teammates
- You want permanent record in git
- You're debugging specific session
- You need to analyze patterns

❌ **Use Realtime Dashboard When**:
- You're actively monitoring development
- You want instant feedback
- You prefer visual UI
- You need live metrics

---

## Related Documentation

- **Realtime Dashboard**: `SCANNER_DASHBOARD_COMPLETE_SUMMARY.md`
- **All Visualization Options**: `SCANNER_VISUALIZATION_OPTIONS.md`
- **Build Magic**: `.kiro/steering/build-time-magic.md`

---

## Summary

**Question**: "Kalau scanner output ini ditampilkan bukan di terminal tapi ditulis ke output statis gimana?"

**Answer**: Buat 2 script capture:
1. Bash script (mudah)
2. Node.js script (flexible)

Both capture output ke static files (.txt, .jsonl, .txt summary)

**Usage**: 
```bash
./dev-with-scanner-capture.sh
```

**Output**: 
```
.next/tw-classes/scanner-output.txt       (all output)
.next/tw-classes/scanner-output.jsonl     (scanner events JSON)
.next/tw-classes/scanner-summary.txt      (statistics)
```

---

**Created**: July 4, 2026  
**Status**: ✅ Ready to Use  
**Complexity**: Beginner-friendly (just bash redirect + parsing)
