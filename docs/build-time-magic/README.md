# Build-Time Magic Documentation

Complete documentation tentang 18 magic layers yang di-generate oleh tailwind-styled-v4 engine.

## 📚 Files (in recommended reading order)

### 1. **01-QUICK_REFERENCE.md** (5 min)
Ringkasan singkat 4 magic layers utama:
- Rust scanning (50ms)
- State pre-generation (20ms)
- Route attribution (100ms)
- Tailwind PostCSS (200ms)

**Start here** untuk overview cepat.

---

### 2. **02-FLOW_DIAGRAM.md** (15 min)
Arsitektur dan flow diagram:
- Bagaimana scanning bekerja
- Component hash determinism
- Cycle detection mechanism
- False positive filtering

---

### 3. **03-NEXT_MAGIC_EXPLAINED.md** (30 min)
Deep technical dive ke Layer 1-4:
- Rust scanner details
- State rules generation
- Route attribution algorithm
- Tailwind CSS integration

---

### 4. **04-COMPLETE_NEXT_FOLDER.md** (30 min)
Eksplorasi lengkap `.next/` folder:
- Struktur folder .next/
- What ships to browser
- What's build-time only
- Size breakdown

---

### 5. **05-BUILD_ARTIFACTS_BREAKDOWN.md** (20 min)
Inspeksi real files:
- Content dari setiap file
- Actual file sizes
- Examples dari generated output

---

### 6. **06-ALL_18_LAYERS.md** ⭐ (45 min)
**COMPREHENSIVE REFERENCE** - All 18 layers explained:

**Layers Documented**:
1. Rust scanning → `_initial-scan.css`
2. State pre-generation → `_tw-state-static.css`
3. Route attribution → `css-manifest.json`
4. Tailwind PostCSS → CSS files
5. **Per-route CSS splitting**
6. **App Router integration**
7. **Route manifest generation**
8. **Pre-rendering metadata**
9. **Server route mapping**
10. **Server functions registry**
11. **Build cache management**
12. **Cycle detection**
13. **JS code splitting**
14. **Build diagnostics**
15. **TypeScript definitions**
16. **Turbopack incremental cache**
17. **Pre-rendered HTML**
18. **Layout composition**

Includes:
- Integration between all layers
- Performance metrics
- Build-time vs runtime breakdown
- Complete request flow
- Real file examples

---

## 🎯 Learning Paths

### Path A: Quick Understanding (20 min)
```
1. 01-QUICK_REFERENCE.md (5 min)
2. 02-FLOW_DIAGRAM.md (15 min)
```
Result: Know 4 main layers + why it's fast

---

### Path B: Intermediate (75 min)
```
1. 01-QUICK_REFERENCE.md (5 min)
2. 02-FLOW_DIAGRAM.md (15 min)
3. 03-NEXT_MAGIC_EXPLAINED.md (30 min)
4. 04-COMPLETE_NEXT_FOLDER.md (30 min)
```
Result: Understand all magic, know .next/ structure

---

### Path C: Master/Architect (135 min)
```
1. All from Path B (75 min)
2. 05-BUILD_ARTIFACTS_BREAKDOWN.md (20 min)
3. 06-ALL_18_LAYERS.md (45 min)
```
Result: Expert knowledge of complete architecture

---

## 🔗 Related Documentation

**Theme Setup** (related):
- `../theme-architecture/` - Theme management patterns

**Accessibility** (integrates with layers):
- `../accessibility/` - ARIA & semantic components

**Integration Guides**:
- `../WAVE5_INTEGRATION_GUIDE.md` - Implementation steps
- `../WAVE5_PROGRESS.md` - Current status

---

## 📊 Key Statistics

```
Total Magic Layers:     18
Documentation Files:    6
Reading Time (quick):   5 min
Reading Time (full):    45 min
Total Documentation:    90-135 min
Magic Overhead:         370ms build-time
Runtime Cost:           0ms ✅
Shipping Size:          5.6MB gzipped
```

---

## ✅ What You'll Learn

After reading all files:
- ✅ How Rust engine scans files 425× faster
- ✅ Why component hashing is deterministic
- ✅ How routes get separate CSS files
- ✅ What files ship to browser vs build-time only
- ✅ How 18 layers work together
- ✅ Performance at each layer
- ✅ Complete request flow
- ✅ Integration between layers

---

## 🚀 Next Steps

1. **Read** based on your role:
   - Beginners: Start with 01-QUICK_REFERENCE.md
   - Architects: Start with 06-ALL_18_LAYERS.md
   
2. **Explore** the generated files:
   - Check `.next/tw-classes/` while reading
   - Check `.next/static/css/tw/` for CSS manifest
   - Check `.next/routes-manifest.json` for routing
   
3. **Reference** during development:
   - Keep these docs handy
   - Use as reference when building components
   - Share with team members

---

**Status**: ✅ Complete documentation | ✅ All 18 layers explained | ✅ Production ready

