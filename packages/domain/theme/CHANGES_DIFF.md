## Exact Changes Required

### File: packages/domain/theme/src/liveTokenEngine.ts

**Before (Lines 1-5):**
```typescript
import React from "react"

import type { TokenMap } from '@tailwind-styled/shared'
export type { TokenMap }

```

**After (Lines 1-7):**
```typescript
"use client"

import React from "react"

import type { TokenMap } from '@tailwind-styled/shared'
export type { TokenMap }

```

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| Lines 1-5 | No directive | `"use client"` added at line 1 |
| Line 3 | React import | Same (now line 4) |
| Rest of file | Unchanged | Unchanged |

**Total Impact:** +1 line (the directive)  
**Breaking Changes:** None  
**Side Effects:** None  

---

## Why This Single Line Fix Everything

The hook `createUseTokens()` in this file returns a function that calls:
- `React.useState(engine.getTokens())` (line 208)
- `React.useEffect(...)` (line 210)

When a Client Component tree gets rendered during SSR, Next.js/Turbopack needs to know:
1. This file is part of the client boundary (not a Server Component)
2. React hooks called here should use the client-bundled React, not a different resolver

The `"use client"` directive tells the bundler exactly this, ensuring React stays consistent throughout the render pass.

---

## How to Apply

**Option 1: Manual Edit**
1. Open `packages/domain/theme/src/liveTokenEngine.ts`
2. Add `"use client"` as the very first line
3. Save

**Option 2: Programmatic**
```bash
sed -i '1s/^/"use client"\n\n/' packages/domain/theme/src/liveTokenEngine.ts
```

**Option 3: Use Provided Files**
- Use `liveTokenEngine.ts` from outputs (already fixed)
- Or extract from `css-in-rust-fixed.tar.gz`

---

## Next Step After Applying Fix

```bash
# Rebuild the library
npm run build

# Test in example app
cd examples/next-js-app
npm run dev   # Should NOT crash at LiveTokenDemo anymore
```

Expected output:
```
✓ Ready in XXXms
[scanner] cache invalidated: native binary berubah...
[scanner] cache MISS ...
[scanner] using native parser...
```

No "Invalid hook call" error ✅
