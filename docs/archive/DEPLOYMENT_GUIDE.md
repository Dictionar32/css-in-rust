# Phase 2 Deployment Guide - Production Ready

**Date**: June 10, 2026  
**Version**: Phase 2 Final (v2.0.0)  
**Status**: Ready for Production Deployment

---

## Prerequisites

### System Requirements
- Node.js 16.x or later
- Rust 1.70+
- npm 8.x or yarn 3.x

### Build Environment
- NAPI build tools configured
- C++ compiler available
- Python 3.8+ (for build scripts)

### Optional
- Docker (for containerized deployment)
- Kubernetes (for scale deployment)

---

## Installation

### Step 1: Clone and Setup

```bash
# Clone repository
git clone <repo-url>
cd css-in-rust

# Install dependencies
npm install

# Build Rust components
npm run build:rust
```

### Step 2: Verify Installation

```bash
# Run tests
npm test

# Verify NAPI functions
npm run verify:napi
```

### Step 3: Run Benchmarks

```bash
# Performance baseline
npm run bench

# Scale testing
npm run bench:scale
```

---

## Configuration

### Memory Budget Configuration

**Small Workloads** (< 1K classes):
```json
{
  "cacheConfig": {
    "budget_mb": 5,
    "parse_cache_mb": 1.5,
    "resolve_cache_mb": 1.5,
    "compile_cache_mb": 2.0,
    "streaming_batch_size": 50
  }
}
```

**Medium Workloads** (1K - 10K classes):
```json
{
  "cacheConfig": {
    "budget_mb": 10,
    "parse_cache_mb": 4.0,
    "resolve_cache_mb": 3.5,
    "compile_cache_mb": 2.5,
    "streaming_batch_size": 100
  }
}
```

**Large Workloads** (> 10K classes):
```json
{
  "cacheConfig": {
    "budget_mb": 20,
    "parse_cache_mb": 9.0,
    "resolve_cache_mb": 6.0,
    "compile_cache_mb": 5.0,
    "streaming_batch_size": 200
  }
}
```

### Environment Variables

```bash
# Production
export NODE_ENV=production

# Memory limits
export CACHE_BUDGET_MB=10

# Streaming configuration
export STREAMING_BATCH_SIZE=100

# Performance monitoring
export ENABLE_METRICS=true
```

---

## Deployment Steps

### Step 1: Pre-Deployment Verification

```bash
# Run full test suite
npm run test:full

# Check performance
npm run bench:full

# Verify scale
npm run bench:scale
```

### Step 2: Build for Production

```bash
# Build optimized binary
npm run build:production

# Generate type definitions
npm run generate:types

# Create distribution bundle
npm run bundle
```

### Step 3: Stage Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke:staging

# Monitor metrics
npm run monitor:staging
```

### Step 4: Production Deployment

```bash
# Deploy to production
npm run deploy:production

# Verify deployment
npm run verify:production

# Enable monitoring
npm run monitor:production
```

---

## NAPI Functions Reference

### 20 Total Functions Available

**Week 5: Base Caches (14 functions)**
- `parse_class()` / `parse_with_cache()`
- `resolve_color()` / `resolve_with_cache()`
- `compile_class()` / `compile_with_cache()`
- `get_cache_hit_rate()`
- `get_cache_stats()`
- `clear_cache()`
- `set_cache_size()`
- `get_cache_memory_usage()`
- Plus 6 specialized functions

**Week 6: Advanced Strategies (3 functions)**
- `get_cache_optimization_hints()`
- `estimate_streaming_batch_size()`
- `get_week6_features_status()`

**Week 8: Memory Optimization (3 functions)**
- `get_memory_stats_native()`
- `get_memory_recommendations_native()`
- `estimate_optimal_cache_config_native()`

### Usage Example

```typescript
import native from '@tailwind-styled/native';

// Use cache functions
const result = native.parse_with_cache("md:hover:bg-blue-600");
const stats = native.get_cache_stats();
const memory = native.get_memory_stats_native();

// Get optimization recommendations
const recommendations = native.get_memory_recommendations_native();
const config = native.estimate_optimal_cache_config_native(10.0, "medium");
```

---

## Performance Tuning

### Optimize for Your Workload

**Identify Workload Size**:
```bash
# Count unique classes in your app
npm run analyze:classes
```

**Select Configuration**:
- 1-5K classes → Use "small" config
- 5-20K classes → Use "medium" config
- 20K+ classes → Use "large" config

**Monitor Performance**:
```bash
npm run monitor:performance
```

### Cache Warming

Pre-populate cache on startup:
```typescript
import native from '@tailwind-styled/native';

async function warmCache() {
  // Parse all known classes
  const classes = await loadAllClasses();
  for (const cls of classes) {
    native.parse_with_cache(cls);
  }
  
  // Check statistics
  const stats = native.get_cache_stats();
  console.log(`Cache warmed: ${stats.hit_count} entries`);
}

await warmCache();
```

### Batch Processing

For large-scale compilation:
```typescript
import native from '@tailwind-styled/native';

async function processBatch(classes: string[]) {
  const batchSize = native.estimate_streaming_batch_size(
    classes.length,
    512,
    10 // 10 MB budget
  );
  
  const results = [];
  for (let i = 0; i < classes.length; i += batchSize) {
    const batch = classes.slice(i, i + batchSize);
    for (const cls of batch) {
      results.push(native.compile_with_cache(cls));
    }
  }
  
  return results;
}
```

---

## Monitoring

### Health Check Endpoints

```bash
# Memory usage
GET /health/memory

# Cache statistics
GET /health/cache

# Performance metrics
GET /metrics/performance
```

### Key Metrics to Track

```
Cache Hit Rate:      Target >80%
Memory Usage:        Target <10 MB (medium)
Response Time:       Target <50ms (cached)
Throughput:          Target >1K ops/sec
```

### Alerting Rules

```yaml
alerts:
  - name: HighMemoryUsage
    condition: memory_mb > 12
    severity: warning
    
  - name: LowCacheHitRate
    condition: cache_hit_rate < 70
    severity: warning
    
  - name: HighLatency
    condition: response_time_ms > 100
    severity: critical
```

---

## Troubleshooting

### Issue: High Memory Usage

**Symptoms**: Memory grows beyond budget

**Solutions**:
1. Reduce cache sizes
2. Enable streaming for large batches
3. Decrease LRU cache max entries
4. Check for memory leaks

```bash
npm run diagnose:memory
```

### Issue: Low Cache Hit Rate

**Symptoms**: Hit rate < 75%

**Solutions**:
1. Increase cache sizes
2. Check if unique classes exceeds cache size
3. Verify cache configuration
4. Review workload characteristics

```bash
npm run diagnose:cache
```

### Issue: Slow Performance

**Symptoms**: Response time > 50ms

**Solutions**:
1. Enable batch processing
2. Use streaming for large compilations
3. Warm cache on startup
4. Review memory configuration

```bash
npm run diagnose:performance
```

---

## Rollback Procedure

### If Issues Encountered

```bash
# 1. Identify issue
npm run diagnose

# 2. Check logs
npm run logs:tail

# 3. Rollback to previous version
npm run rollback:production

# 4. Verify rollback
npm run verify:production
```

### Automatic Rollback (if enabled)

```yaml
deployment:
  auto_rollback: true
  rollback_on_error_rate: 5  # percent
  rollback_on_latency: 100   # ms
```

---

## Scaling Strategy

### Horizontal Scaling

For multiple instances:
```bash
# Deploy to multiple nodes
npm run deploy:multi-node

# Configure load balancing
npm run configure:load-balancer

# Monitor distributed cache
npm run monitor:distributed
```

### Vertical Scaling

For single large instance:
```bash
# Configure for large workload
npm run configure:large-workload

# Monitor resource usage
npm run monitor:resources

# Performance tune
npm run tune:performance
```

---

## Security Considerations

### Input Validation

All NAPI functions validate input:
```typescript
// Input is validated and sanitized
const result = native.parse_with_cache(userInput);
```

### Memory Protection

- LRU eviction prevents unbounded growth
- Streaming prevents memory spikes
- Adaptive sizing manages growth

### Performance Isolation

- Thread-safe operations
- No shared mutable state
- Concurrent access protected

---

## Support & Maintenance

### Monitoring Dashboard

```bash
npm run dashboard:monitoring
```

### Generate Reports

```bash
# Daily report
npm run report:daily

# Weekly summary
npm run report:weekly

# Performance analysis
npm run report:performance
```

### Logs and Diagnostics

```bash
# View recent logs
npm run logs:recent

# Export diagnostics
npm run export:diagnostics

# Analyze issues
npm run analyze:issues
```

---

## Version Management

### Semantic Versioning

- Major: Breaking API changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Update Strategy

```bash
# Check for updates
npm outdated

# Update to latest minor version
npm update

# Update to specific version
npm install @tailwind-styled/native@2.0.0
```

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to internal staging
- Run full test suite
- Validate performance

### Phase 2: Beta Release (Week 2)
- Deploy to limited beta users
- Gather feedback
- Monitor metrics

### Phase 3: Gradual Rollout (Week 3-4)
- 10% production traffic
- 50% production traffic
- 100% production traffic

### Phase 4: Full Production (Week 5+)
- Monitor continuously
- Optimize based on data
- Support users

---

## Success Criteria

### Deployment Success

- [x] Build completes without errors
- [x] All tests pass
- [x] Performance benchmarks met
- [x] Memory targets achieved
- [ ] Production deployment successful
- [ ] Zero critical issues

### Post-Deployment

- [ ] 99.9% uptime
- [ ] <50ms response time (p95)
- [ ] <10 MB memory usage
- [ ] >80% cache hit rate

---

## Contacts & Support

### Deployment Team
- Lead: DevOps
- Primary: SRE Team
- Backup: Platform Team

### Escalation
- Performance issues: Performance Team
- Memory issues: Rust Team
- NAPI issues: Native Team

---

## Appendix

### Quick Reference

**Start Development**:
```bash
npm run dev
```

**Run Tests**:
```bash
npm test
```

**Build Production**:
```bash
npm run build:production
```

**Deploy**:
```bash
npm run deploy:production
```

---

**Document Status**: Ready for Production  
**Last Updated**: June 10, 2026  
**Version**: Phase 2 Final (v2.0.0)
