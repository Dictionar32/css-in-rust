# Scanner Dashboard — Visual Guide

## What It Looks Like

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 Scanner DevTools                                          │
│  Real-time Tailwind Scanner Diagnostics & Performance        │
│  Data Source: MOCK                                            │
└──────────────────────────────────────────────────────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 📊          │ 📊          │ 📊          │ 📊          │
│ 57          │ 54          │ 3           │ 94.7%       │
│ Total Scans │ Cache Hits  │ Cache Miss  │ Hit Rate    │
└─────────────┴─────────────┴─────────────┴─────────────┘

⚙️ Scanner Status
├─ Engine: Rust Parser (NAPI)
├─ Speed: ~50ms / scan
├─ Files Tracked: 81 TypeScript/JSX
└─ Classes Found: ~1200 strings

📋 Scanner Log Feed (14 entries)
┌────────────────────────────────────────────────────────────┐
│ 4:35:22 PM  ✓ HIT    [scanner] cache HIT /src/proxy.ts    │
│ 4:35:23 PM  ✓ HIT    [scanner] cache HIT /src/hooks/*.ts  │
│ 4:35:24 PM  ✓ HIT    [scanner] cache HIT /src/components/ │
│ 4:35:25 PM  ✗ MISS   [scanner] cache MISS /app/page.tsx   │
│ 4:35:26 PM  ⚡ NAT   [scanner] [native] using parser .... │
│                                                            │
│ (Shows last 50 entries, auto-scrolls)                    │
└────────────────────────────────────────────────────────────┘

⚡ Performance Details
┌─────────────────────┐
│ Startup Time: 386ms │
│ Avg Scan: 6.7ms/f  │
│ Cache: LRU+Det      │
│ Rust Speedup: 425× │
└─────────────────────┘

📁 File Scan Details (Sample)
┌──────────────────────────┬─────────┬──────┐
│ /src/proxy.ts            │ 12 cls  │ HIT  │
│ /src/hooks/useTheme.ts   │ 8 cls   │ HIT  │
│ /src/components/Alert    │ 24 cls  │ HIT  │
│ /src/components/Button   │ 42 cls  │ HIT  │
│ /app/dasar-css/box-model │ 156 cls │ MISS │
└──────────────────────────┴─────────┴──────┘
```

---

## Color Scheme

| Element | Color | Meaning |
|---------|-------|---------|
| HIT | 🟢 Emerald | Cache found, scan skipped |
| MISS | 🟡 Amber | Cache miss, file re-scanned |
| NATIVE | 🔵 Cyan | Rust parser event |
| ERROR | 🔴 Red | Scan error |
| INFO | ⚪ Slate | Generic info message |

---

## Responsiveness

### Desktop (1024px+)
```
4-column grid:
[Stat] [Stat] [Stat] [Stat]
```

### Tablet (768px+)
```
2-column grid:
[Stat] [Stat]
[Stat] [Stat]
```

### Mobile (< 768px)
```
Single column:
[Stat]
[Stat]
[Stat]
[Stat]
```

---

## Dark Theme Colors

```
Background:   slate-950 (#030712) - Deep black
Borders:      slate-700 (#374151) - Dark gray
Text Normal:  slate-100 (#f1f5f9) - Light
Text Muted:   slate-400 (#94a3b8) - Mid gray

Accent Colors:
- Primary:    emerald-400 (#34d399) - Green (success)
- Warning:    amber-400 (#fbbf24)   - Orange (caution)
- Info:       cyan-400 (#22d3ee)    - Cyan (info)
- Error:      red-400 (#f87171)     - Red (error)
```

---

## Data Flow Diagram

```
┌─────────────────┐
│ Dev Terminal    │
│ npm run dev     │
└────────┬────────┘
         │
         ▼ [scanner] cache HIT
    ┌─────────────────────────────────────┐
    │ Turbopack / Next.js Compiler        │
    │ (Tailwind Scanner Running)          │
    └────────┬────────────────────────────┘
             │
             ▼ Optional: Save logs
    ┌──────────────────────────────────────┐
    │ .next/tw-classes/                    │
    │ _scanner-log.jsonl                   │
    └────────┬──────────────────────────────┘
             │
             ▼ API reads file or mocks
    ┌──────────────────────────────────────┐
    │ GET /api/scanner/logs                │
    │ Returns JSON with logs + stats       │
    └────────┬──────────────────────────────┘
             │ Fetches every 2 seconds
             ▼
    ┌──────────────────────────────────────┐
    │ Browser JavaScript (React)           │
    │ updateLogs(data)                     │
    │ setStats(data.stats)                 │
    └────────┬──────────────────────────────┘
             │
             ▼ Re-renders
    ┌──────────────────────────────────────┐
    │ Dashboard UI (/dev/scanner)          │
    │ - Stats cards                        │
    │ - Log feed                           │
    │ - Performance metrics                │
    │ - File details                       │
    └──────────────────────────────────────┘
```

---

## Network Requests

### Polling Pattern
```
Time: 00:00 — Page loads
         └─ GET /api/scanner/logs ─────────┐
                                            ▼ Response
                                   Update dashboard

Time: 00:02 — Auto-poll
         └─ GET /api/scanner/logs ─────────┐
                                            ▼ Response
                                   Update dashboard (if changed)

Time: 00:04 — Auto-poll
         └─ GET /api/scanner/logs ─────────┐
                                            ▼ Response
                                   Update dashboard (if changed)

(Repeats every 2 seconds while page is open)
```

### Response Payload
```json
{
  "success": true,
  "logs": [
    {
      "id": "1",
      "timestamp": "4:35:22 PM",
      "type": "hit",
      "message": "[scanner] cache HIT",
      "file": "/src/proxy.ts"
    },
    {
      "id": "2",
      "timestamp": "4:35:23 PM",
      "type": "hit",
      "message": "[scanner] cache HIT",
      "file": "/src/hooks/useTheme.ts"
    }
    // ... more logs
  ],
  "stats": {
    "totalScans": 57,
    "cacheHits": 54,
    "cacheMisses": 3,
    "errors": 0
  },
  "timestamp": "2026-07-04T14:35:22.123Z",
  "source": "mock"
}
```

---

## Page Sections Breakdown

### Header
```
┌──────────────────────────────┐
│ 🔍 Scanner DevTools          │
│ Real-time Tailwind Scanner   │
│ Data Source: MOCK            │
└──────────────────────────────┘
```
- Title + subtitle
- Data source badge (MOCK/REAL)
- Loading indicator (if fetching)

### Performance Metrics
```
┌──────────┬──────────┬──────────┬──────────┐
│ Total    │ Cache    │ Cache    │ Hit      │
│ Scans    │ Hits     │ Misses   │ Rate     │
│ 57       │ 54       │ 3        │ 94.7%    │
└──────────┴──────────┴──────────┴──────────┘
```
- 4 stat cards
- Key metrics at a glance

### Scanner Status
```
┌──────────────┬──────────────┐
│ Engine       │ Speed        │
│ Rust Parser  │ ~50ms / scan │
├──────────────┼──────────────┤
│ Files        │ Classes      │
│ 81 TS/JSX    │ ~1200 found  │
└──────────────┴──────────────┘
```
- Status cards
- System info

### Live Log Feed
```
[Scrollable area with 14 entries]

4:35:22 PM  ✓ HIT    [scanner] cache HIT /src/proxy.ts
4:35:23 PM  ✓ HIT    [scanner] cache HIT /src/hooks/...
...
[Last 50 entries shown]
```
- Auto-scrolls as new logs arrive
- Color-coded by type

### Performance Details
```
Startup Time:    386ms
Avg Scan Time:   6.7ms/file
Cache Strategy:  LRU + Deterministic
Rust Speedup:    425× vs JS
```
- Technical specs
- Optimization metrics

### File Scan Details
```
/src/proxy.ts              12 classes    ✓ HIT
/src/hooks/useTheme.ts      8 classes    ✓ HIT
/src/components/Alert      24 classes    ✓ HIT
/src/components/Button     42 classes    ✓ HIT
/app/dasar-css/box-model  156 classes    ✗ MISS
```
- Per-file breakdown
- Class counts
- Cache status

---

## Interaction Flow

```
1. User navigates to /dev/scanner
   ↓
2. Page renders with mock data (instant)
   ↓
3. useEffect fires, calls fetchLogs()
   ↓
4. Fetches /api/scanner/logs
   ↓
5. Sets logs, stats, source state
   ↓
6. Component re-renders with real data
   ↓
7. Every 2 seconds, repeat from step 3
   ↓
8. Dashboard stays up-to-date
```

---

## Stats Calculation

```typescript
// From 14 mock logs:
totalScans = 14
cacheHits = 11 (type === "hit")
cacheMisses = 1 (type === "miss")
errors = 0 (type === "error")
hitRate = (11 / 14) * 100 = 78.6%

// Will be different with real data
```

---

## Time Complexity

| Operation | Time |
|-----------|------|
| Page load | ~200ms |
| API fetch | ~20ms |
| JSON parse | ~10ms |
| React render | ~50ms |
| Total/2s poll | ~80ms |

---

## Browser Compatibility

✅ **Works on**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses standard web APIs:
- `fetch()`
- `useEffect`
- `useState`
- CSS Grid

---

## Accessibility

✅ **Features**:
- Semantic HTML (sections, headers)
- Color + text for status (not color-only)
- Monospace for code/logs (readable)
- High contrast (slate-100 on slate-950)
- Responsive layout (works on mobile)

---

## File Size Impact

```
page.tsx:           ~6 KB
route.ts:           ~4 KB
Mock data (inline): ~2 KB
─────────────────────────
Total JS:          ~12 KB (gzipped: ~3 KB)

No external dependencies (uses built-in fetch, React hooks)
```

---

**TL;DR**: Open `http://localhost:3000/dev/scanner` → See all scanner output in beautiful UI instead of terminal! 🎨

