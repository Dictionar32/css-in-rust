# Scanner Output Visualization — Display Options

**Goal**: Tampilkan scanner output (yang normalnya muncul di terminal) di web UI instead of console

---

## Option 1: Scanner DevTools Dashboard ✅ CREATED

**Route**: `/dev/scanner`  
**Status**: Ready to use  
**File**: `examples/next-js-app/src/app/dev/scanner/page.tsx`

### Features
- 📊 **Performance Metrics**: Total scans, cache hits/misses, hit rate %
- ⚙️ **Scanner Status**: Engine type, speed, files tracked, classes found
- 📋 **Live Log Feed**: Real-time scanner output (cache HIT/MISS, native parser)
- ⚡ **Performance Details**: Startup time, avg scan time, cache strategy, Rust speedup
- 📁 **File Scan Details**: Per-file breakdown with class counts

### How to Access
```
http://localhost:3000/dev/scanner
```

### Current State
- ✅ Mock data integrated (simulating real scanner output)
- ✅ Styled with `tw()` components
- ✅ Dark theme (matches dev aesthetics)
- ✅ Responsive layout

### To Implement Real Data
You'll need to:

1. **Option A: Next.js API Route**
   ```typescript
   // app/api/scanner/logs/route.ts
   export async function GET() {
     // Read from scanner cache file
     // return logs as JSON
   }
   ```

2. **Option B: WebSocket Stream**
   ```typescript
   // Pipe scanner stdout to WebSocket
   // Real-time updates in browser
   ```

3. **Option C: File System Monitor**
   ```typescript
   // Watch .next/tw-classes/ folder
   // React to file changes
   ```

---

## Option 2: Terminal Logger with File Output

If you want to keep **terminal output AND save to file**:

### Implementation
```bash
# Run with output redirection
npm run dev 2>&1 | tee scanner-output.log

# Or use script that captures both
node capture-scanner-output.mjs
```

### File Created
```
scanner-output.log          # Real-time log file
scanner-output-<date>.log   # Timestamped versions
```

### Then View in Web UI
```typescript
// Page that reads scanner-output.log
const logs = await fs.readFile('scanner-output.log', 'utf-8')
```

---

## Option 3: Structured Logger Integration

Replace console logs with structured logging:

```typescript
// lib/logger.ts
class ScannerLogger {
  private logs: ScannerLog[] = []
  
  log(type: string, message: string, file?: string) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      message,
      file,
    }
    
    this.logs.push(entry)
    
    // Also write to file
    fs.appendFileSync('scanner-logs.jsonl', JSON.stringify(entry) + '\n')
    
    // And console
    console.log(`[${type}] ${message}`)
  }
}
```

---

## Option 4: Browser DevTools Integration

Create a custom browser DevTools panel:

```typescript
// Extension that intercepts console logs from scanner
// Displays in dedicated DevTools tab
```

**Complexity**: High  
**Benefit**: Most polished experience

---

## Option 5: Integrated Web UI (Next.js Component)

Add scanner widget directly in app layout:

```typescript
// components/ScannerWidget.tsx
// Always-visible sidebar with live scanner data
// Toggleable, can minimize/expand
```

---

## Recommended Stack

**For Development** (what we created):
1. ✅ **Dashboard at `/dev/scanner`** (Option 1)
   - View real-time metrics
   - Check cache hit rate
   - Debug scan issues

2. **Optional: Log File** (Option 2)
   - Backup of all scans
   - Historical analysis

**For Production**:
- Option 3 (Structured Logger) for logging
- Keep `/dev/scanner` but with readonly data

---

## How to Enhance `/dev/scanner`

### Step 1: Connect to Real Data

```typescript
// examples/next-js-app/src/app/dev/scanner/page.tsx

// Add useEffect that fetches logs
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch('/api/scanner/logs')
    const data = await res.json()
    setLogs(data.logs)
    setStats(data.stats)
  }, 1000)
  
  return () => clearInterval(interval)
}, [])
```

### Step 2: Create API Route

```typescript
// examples/next-js-app/src/app/api/scanner/logs/route.ts
export async function GET() {
  // Read from .next/tw-classes/_scanner-log.jsonl
  // Parse and return structured data
  return Response.json({
    logs: [...],
    stats: { totalScans, cacheHits, ... }
  })
}
```

### Step 3: Add WebSocket for Live Updates

```typescript
// Real-time push of scanner events
// As files are scanned, update dashboard instantly
```

---

## File Structure Created

```
examples/next-js-app/
├── src/
│   ├── app/
│   │   └── dev/
│   │       └── scanner/
│   │           └── page.tsx  ← Scanner DevTools Dashboard
│   │
│   ├── api/
│   │   └── scanner/
│   │       └── logs/
│   │           └── route.ts  ← (Create if using Option 1B)
│   │
│   └── lib/
│       └── scanner-logger.ts  ← (Create if using Option 3)
```

---

## Summary: What Each Option Does

| Option | Terminal Output | Web Dashboard | Real-time | Complexity | Best For |
|--------|---|---|---|---|---|
| **1: DevTools** | ✅ Yes | ✅ Yes | With API | Medium | Development |
| **2: File Logger** | ✅ Yes | Via file read | No | Low | Archival |
| **3: Structured** | ✅ Yes (JSON) | ✅ Yes | Yes | Medium | Production |
| **4: DevTools Panel** | ✅ Yes | ✅ Yes (Browser) | Yes | High | Advanced |
| **5: Widget** | ✅ Yes | ✅ Yes (Inline) | Yes | Medium | Integrated |

---

## Current Implementation Status

✅ **Created**: Scanner DevTools Dashboard (`/dev/scanner`)
- Mock data integrated
- Styled components ready
- Can view at: `http://localhost:3000/dev/scanner`

⏳ **Next Step**: Connect real scanner data
- Option A: API route that reads `.next/tw-classes/` files
- Option B: WebSocket for live streaming
- Option C: File watcher for changes

---

## To Use Right Now

1. **Start dev server**:
   ```bash
   cd examples/next-js-app
   npm run dev
   ```

2. **Open scanner dashboard**:
   ```
   http://localhost:3000/dev/scanner
   ```

3. **View mock data** (shows what real data would look like)

4. **To add real data**: Implement API route + WebSocket as outlined above

---

## Related Files

- **Dashboard**: `examples/next-js-app/src/app/dev/scanner/page.tsx`
- **Build Magic Docs**: `.kiro/steering/build-time-magic.md`
- **Dev Server Status**: `DEV_SERVER_STATUS_JULY4.md`

---

**Created**: July 4, 2026  
**Status**: Dashboard ready, data integration pending  
**Recommendation**: Start with Option 1 (Dashboard) + Option 2 (Log File)
