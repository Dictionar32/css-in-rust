# Performance Monitoring Setup Guide

**Status**: Ready to Deploy  
**Date**: June 9, 2026  
**Purpose**: Real-time monitoring of CSS pipeline performance improvements

---

## Overview

This guide sets up comprehensive monitoring for the JavaScript to Rust migration project. Track cache effectiveness, build times, and performance improvements across phases.

---

## Part 1: Metrics Infrastructure

### 1.1 Core Metrics Collected

#### Cache Metrics
```javascript
{
  cache_hits: number,           // Total cache hits
  cache_misses: number,         // Total cache misses
  hit_rate: number,             // Percentage 0-1
  cache_size: number,           // Current entries
  cache_max_size: number,       // Maximum capacity
  cache_memory_kb: number,      // Memory used
}
```

#### Build Time Metrics
```javascript
{
  total_build_ms: number,       // Total build time
  cache_check_ms: number,       // Cache lookup time
  css_compile_ms: number,       // CSS generation time
  lightning_css_ms: number,     // Minification time
  overhead_ms: number,          // Other overhead
}
```

#### Usage Pattern Metrics
```javascript
{
  files_changed: number,        // Per session
  unique_class_sets: number,    // Variance indicator
  avg_classes_per_file: number, // Pattern tracking
  watch_cycles: number,         // Total rebuild cycles
  project_size: {
    total_files: number,
    total_classes: number,
    components: number,
  }
}
```

### 1.2 Telemetry Events

**Event: Build Complete**
```javascript
{
  event: 'build:complete',
  timestamp: 1623456789,
  duration_ms: 156,
  cache_hit: true,
  classes_compiled: 24,
  css_bytes: 1234,
  metrics: { /* ... */ }
}
```

**Event: Cache Performance**
```javascript
{
  event: 'cache:stats',
  timestamp: 1623456789,
  hits: 158,
  misses: 94,
  hit_rate: 0.627,
  size: 89,
  evictions: 5,
}
```

**Event: Performance Alert**
```javascript
{
  event: 'perf:alert',
  level: 'warning' | 'error',
  timestamp: 1623456789,
  message: 'Build time exceeded threshold',
  actual_ms: 250,
  threshold_ms: 150,
}
```

---

## Part 2: Integration with Build Tools

### 2.1 Next.js Integration

**Step 1: Create monitoring plugin**

File: `next.config.monitoring.js`

```javascript
const { getCacheStats, clearCache } = require('@tailwind-styled/compiler/internal')

class TailwindMonitoringPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      logInterval: 60000, // Log every 60 seconds
      alertThresholds: {
        buildTime: 200,    // ms
        hitRate: 0.40,     // %
        cacheSize: 95,     // entries
      },
      ...options,
    }
    this.stats = {
      sessionStart: Date.now(),
      buildCount: 0,
      totalTime: 0,
    }
  }

  onBuildEnd() {
    if (!this.options.enabled) return

    const stats = getCacheStats()
    const now = Date.now()
    const sessionDuration = (now - this.stats.sessionStart) / 1000

    this.stats.buildCount++
    
    // Log to monitoring system
    this.logMetrics({
      timestamp: now,
      buildCount: this.stats.buildCount,
      hitRate: stats.hitRate,
      cacheSize: stats.size,
      sessionDuration,
    })

    // Check alerts
    this.checkAlerts(stats)
  }

  logMetrics(metrics) {
    const logger = console.log // or your logging system

    if (this.stats.buildCount % 5 === 0) {
      logger('[TW Cache] Session Stats:', {
        builds: metrics.buildCount,
        hitRate: (metrics.hitRate * 100).toFixed(1) + '%',
        cacheSize: metrics.cacheSize + '/100',
        duration: metrics.sessionDuration + 's',
      })
    }
  }

  checkAlerts(stats) {
    const { alertThresholds } = this.options

    if (stats.hitRate < alertThresholds.hitRate) {
      console.warn(`[TW Cache Alert] Low hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
    }

    if (stats.size > alertThresholds.cacheSize) {
      console.warn(`[TW Cache Alert] High cache size: ${stats.size}/${alertThresholds.cacheSize}`)
    }
  }

  configReset() {
    // Clear cache on config reload
    clearCache()
    console.log('[TW Cache] Cache cleared on config reload')
  }
}

module.exports = TailwindMonitoringPlugin
```

**Step 2: Add to next.config.js**

```javascript
const TailwindMonitor = require('./next.config.monitoring')
const monitor = new TailwindMonitor()

module.exports = {
  webpack: (config, { isServer }) => {
    // Add monitoring to build
    if (isServer) {
      const originalBuild = config.plugins.find(p => p.constructor.name === 'Webpack5Cache')
      if (originalBuild) {
        const wrapped = {
          ...originalBuild,
          apply(compiler) {
            compiler.hooks.done.tap('TailwindMonitor', () => {
              monitor.onBuildEnd()
            })
            return originalBuild.apply(compiler)
          }
        }
        config.plugins[config.plugins.indexOf(originalBuild)] = wrapped
      }
    }
    return config
  },
}
```

### 2.2 Vite Integration

**File: `vite.config.monitoring.ts`**

```typescript
import { Plugin } from 'vite'
import { getCacheStats, clearCache } from '@tailwind-styled/compiler/internal'

export function viteMonitoringPlugin(options = {}): Plugin {
  let startTime = Date.now()
  let buildCount = 0

  return {
    name: 'vite-tailwind-monitor',

    configResolved() {
      clearCache()
      console.log('[TW] Cache cleared on config reload')
    },

    handleHotUpdate(ctx) {
      const { file } = ctx
      startTime = Date.now()
      return undefined // Continue with default HMR
    },

    transform() {
      // After transformation
      const elapsed = Date.now() - startTime

      if (elapsed > 150) {
        const stats = getCacheStats()
        console.log(`[TW] Slow rebuild: ${elapsed}ms (cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%)`)
      }

      buildCount++
      
      if (buildCount % 10 === 0) {
        const stats = getCacheStats()
        console.log(`[TW] Cache stats: ${stats.hits}H/${stats.misses}M (${(stats.hitRate * 100).toFixed(1)}%)`)
      }
    },
  }
}
```

**Add to vite.config.ts**:

```typescript
import { viteMonitoringPlugin } from './vite.config.monitoring'

export default {
  plugins: [
    viteMonitoringPlugin({
      slowThreshold: 150, // ms
    }),
  ],
}
```

### 2.3 Webpack Integration

**File: `webpack.monitoring.js`**

```javascript
const { getCacheStats, clearCache } = require('@tailwind-styled/compiler/internal')

class TailwindWebpackMonitor {
  apply(compiler) {
    let buildStart

    compiler.hooks.beforeCompile.tap('TailwindMonitor', () => {
      buildStart = Date.now()
    })

    compiler.hooks.done.tap('TailwindMonitor', (stats) => {
      const buildTime = Date.now() - buildStart
      const cacheStats = getCacheStats()

      const payload = {
        timestamp: Date.now(),
        buildTime,
        cacheHits: cacheStats.hits,
        cacheMisses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        errors: stats.hasErrors() ? stats.compilation.errors.length : 0,
      }

      // Log or send to monitoring
      if (buildTime > 200 || cacheStats.hitRate < 0.4) {
        console.log('[TW Monitor]', payload)
      }
    })

    compiler.hooks.invalid.tap('TailwindMonitor', () => {
      clearCache()
    })
  }
}

module.exports = TailwindWebpackMonitor
```

**Add to webpack.config.js**:

```javascript
const TailwindMonitor = require('./webpack.monitoring')

module.exports = {
  plugins: [
    new TailwindMonitor(),
  ],
}
```

---

## Part 3: Metrics Dashboard

### 3.1 CLI Dashboard (Node.js)

**File: `scripts/monitor-cache.js`**

```javascript
#!/usr/bin/env node

const { getCacheStats } = require('@tailwind-styled/compiler/internal')
const chalk = require('chalk')

function formatStats() {
  const stats = getCacheStats()
  
  const hitRateColor = stats.hitRate > 0.6 ? 'green' : stats.hitRate > 0.4 ? 'yellow' : 'red'
  const sizeColor = stats.size > 90 ? 'yellow' : 'green'

  console.clear()
  console.log(chalk.cyan('═'.repeat(60)))
  console.log(chalk.cyan('  TAILWIND CSS CACHE MONITOR'))
  console.log(chalk.cyan('═'.repeat(60)))
  console.log()

  console.log(chalk.bold('📊 Cache Statistics:'))
  console.log(`  Total Compiles:  ${stats.hits + stats.misses}`)
  console.log(`  Cache Hits:      ${chalk.green(stats.hits)}`)
  console.log(`  Cache Misses:    ${chalk.red(stats.misses)}`)
  console.log()

  console.log(chalk.bold('⚡ Performance:'))
  console.log(`  Hit Rate:        ${chalk[hitRateColor](((stats.hitRate * 100).toFixed(1) + '%'))}`)
  console.log(`  Estimated Saved: ${chalk.green(Math.round((stats.hits * 150) / 1000) + 's')}`)
  console.log()

  console.log(chalk.bold('💾 Memory Usage:'))
  console.log(`  Cached Entries:  ${chalk[sizeColor](stats.size + '/' + stats.maxSize)}`)
  console.log(`  Utilization:     ${chalk[sizeColor](Math.round((stats.size / stats.maxSize) * 100) + '%')}`)
  console.log()

  console.log(chalk.cyan('═'.repeat(60)))
}

// Update every 2 seconds
setInterval(formatStats, 2000)
formatStats()
```

**Run with**:
```bash
node scripts/monitor-cache.js
```

### 3.2 Web Dashboard

**File: `apps/monitor/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Tailwind CSS Cache Monitor</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      margin: 0;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      margin-top: 0;
      color: #93c5fd;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
    }
    
    .metric-title {
      font-size: 14px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #93c5fd;
    }
    
    .metric-unit {
      font-size: 14px;
      color: #94a3b8;
      margin-left: 5px;
    }
    
    .status-good { color: #10b981; }
    .status-warning { color: #f59e0b; }
    .status-bad { color: #ef4444; }
    
    .chart {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      height: 300px;
      margin-bottom: 20px;
    }
    
    canvas { width: 100% !important; height: 100% !important; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="container">
    <h1>📊 Tailwind CSS Cache Monitor</h1>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">Hit Rate</div>
        <div class="metric-value" id="hitRate">--</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-title">Cache Entries</div>
        <div class="metric-value" id="cacheSize">--</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-title">Total Compiles</div>
        <div class="metric-value" id="totalCompiles">--</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-title">Time Saved</div>
        <div class="metric-value" id="timeSaved">--</div>
      </div>
    </div>
    
    <div class="chart">
      <canvas id="hitRateChart"></canvas>
    </div>
    
    <div id="logs" style="
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      height: 200px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
    "></div>
  </div>

  <script>
    let hitRateHistory = []
    let chart

    async function updateMetrics() {
      try {
        const response = await fetch('/api/cache-stats')
        const stats = await response.json()
        
        document.getElementById('hitRate').textContent = 
          (stats.hitRate * 100).toFixed(1) + '%'
        document.getElementById('cacheSize').textContent = 
          stats.size + '/' + stats.maxSize
        document.getElementById('totalCompiles').textContent = 
          (stats.hits + stats.misses)
        document.getElementById('timeSaved').textContent = 
          Math.round((stats.hits * 150) / 1000) + 's'
        
        // Update chart
        hitRateHistory.push(stats.hitRate * 100)
        if (hitRateHistory.length > 60) hitRateHistory.shift()
        
        chart.data.labels = Array.from({length: hitRateHistory.length}, (_, i) => i)
        chart.data.datasets[0].data = hitRateHistory
        chart.update()
        
        // Log
        const log = document.getElementById('logs')
        const timestamp = new Date().toLocaleTimeString()
        log.innerHTML = `${timestamp} | Hit Rate: ${(stats.hitRate * 100).toFixed(1)}% | Size: ${stats.size}/${stats.maxSize}<br>` + log.innerHTML
        if (log.children.length > 20) log.removeChild(log.lastChild)
        
      } catch (e) {
        console.error('Failed to update metrics:', e)
      }
    }

    // Initialize chart
    const ctx = document.getElementById('hitRateChart').getContext('2d')
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Cache Hit Rate %',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#94a3b8' },
            grid: { color: '#334155' }
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: '#334155' }
          }
        }
      }
    })

    // Update every 2 seconds
    updateMetrics()
    setInterval(updateMetrics, 2000)
  </script>
</body>
</html>
```

**Start dashboard with Express**:

```javascript
const express = require('express')
const { getCacheStats } = require('@tailwind-styled/compiler/internal')

const app = express()

app.use(express.static(__dirname))

app.get('/api/cache-stats', (req, res) => {
  const stats = getCacheStats()
  res.json(stats)
})

app.listen(3000, () => {
  console.log('Dashboard running at http://localhost:3000')
})
```

---

## Part 4: Alerting Rules

### 4.1 Configure Alerts

**File: `monitoring/alerts.js`**

```javascript
const { getCacheStats } = require('@tailwind-styled/compiler/internal')

class PerformanceAlerts {
  constructor(config = {}) {
    this.thresholds = {
      hitRate: config.hitRateThreshold || 0.40,
      buildTime: config.buildTimeThreshold || 200,  // ms
      cacheSize: config.cacheSizeThreshold || 95,   // entries
      memoryMb: config.memoryThreshold || 512,      // MB
    }
    
    this.handlers = config.handlers || []
  }

  check(buildMetrics) {
    const stats = getCacheStats()
    const alerts = []

    // Hit rate alert
    if (stats.hitRate < this.thresholds.hitRate) {
      alerts.push({
        level: 'warning',
        type: 'low_hit_rate',
        message: `Cache hit rate dropped below ${(this.thresholds.hitRate * 100).toFixed(0)}%`,
        actual: (stats.hitRate * 100).toFixed(1),
        expected: (this.thresholds.hitRate * 100).toFixed(0),
        recommendation: 'Check build patterns or clear cache'
      })
    }

    // Build time alert
    if (buildMetrics.totalTime > this.thresholds.buildTime) {
      alerts.push({
        level: 'warning',
        type: 'slow_build',
        message: 'Build time exceeded threshold',
        actual: buildMetrics.totalTime,
        expected: this.thresholds.buildTime,
        recommendation: 'Investigate theme complexity or system resources'
      })
    }

    // Cache size alert
    if (stats.size > this.thresholds.cacheSize) {
      alerts.push({
        level: 'info',
        type: 'high_cache_usage',
        message: 'Cache approaching maximum size',
        actual: stats.size,
        expected: this.thresholds.cacheSize,
        recommendation: 'Cache eviction will occur automatically'
      })
    }

    // Emit alerts
    alerts.forEach(alert => this.emit(alert))

    return alerts
  }

  emit(alert) {
    this.handlers.forEach(handler => handler(alert))
  }

  addHandler(fn) {
    this.handlers.push(fn)
  }
}

module.exports = PerformanceAlerts
```

**Usage**:

```javascript
const PerformanceAlerts = require('./monitoring/alerts')

const alerts = new PerformanceAlerts({
  hitRateThreshold: 0.40,
  buildTimeThreshold: 200,
})

// Log to console
alerts.addHandler(alert => {
  console.warn(`[${alert.level.toUpperCase()}] ${alert.message}`)
})

// Send to monitoring service
alerts.addHandler(alert => {
  fetch('https://monitoring.example.com/alerts', {
    method: 'POST',
    body: JSON.stringify(alert)
  })
})

// Check on each build
onBuildComplete(() => {
  alerts.check(buildMetrics)
})
```

---

## Part 5: Performance Reports

### 5.1 Session Report Template

**File: `monitoring/report.js`**

```javascript
function generateSessionReport(sessionData) {
  const report = {
    timestamp: new Date().toISOString(),
    duration: sessionData.endTime - sessionData.startTime,
    metrics: {
      builds: sessionData.totalBuilds,
      cacheHits: sessionData.hits,
      cacheMisses: sessionData.misses,
      hitRate: (sessionData.hits / (sessionData.hits + sessionData.misses) * 100).toFixed(1),
      timeSavedSeconds: Math.round((sessionData.hits * 150) / 1000),
    },
    performance: {
      avgBuildTimeMs: sessionData.totalTime / sessionData.totalBuilds,
      avgBuildTimeWithHitMs: sessionData.avgHitTime,
      avgBuildTimeWithMissMs: sessionData.avgMissTime,
      p95BuildTimeMs: sessionData.p95Time,
      p99BuildTimeMs: sessionData.p99Time,
    },
    recommendations: generateRecommendations(sessionData),
  }
  
  return report
}

function generateRecommendations(data) {
  const recommendations = []
  
  if (data.hits / (data.hits + data.misses) < 0.5) {
    recommendations.push(
      'Low cache hit rate detected. Consider Phase 1 Rust compiler for consistent performance'
    )
  }
  
  if (data.avgMissTime > 200) {
    recommendations.push(
      'Slow compilation on cache misses. Profile theme complexity'
    )
  }
  
  if (data.totalBuilds > 100) {
    recommendations.push(
      'Excellent cache usage! Consider deploying Phase 0 to production'
    )
  }
  
  return recommendations
}

module.exports = { generateSessionReport }
```

### 5.2 Weekly Performance Report

**File: `scripts/weekly-report.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function generateWeeklyReport() {
  const reportPath = path.join(__dirname, '../reports')
  if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath, { recursive: true })

  const sessions = loadSessions()
  const stats = aggregateStats(sessions)

  const report = `
# Weekly Performance Report
Generated: ${new Date().toISOString()}

## Summary
- Total Sessions: ${stats.sessionCount}
- Total Builds: ${stats.totalBuilds}
- Average Hit Rate: ${(stats.avgHitRate * 100).toFixed(1)}%
- Time Saved: ${Math.round(stats.timeSaved / 3600)} hours

## Performance Metrics
- Average Build Time: ${stats.avgBuildTime.toFixed(1)}ms
- P95 Build Time: ${stats.p95BuildTime.toFixed(1)}ms
- P99 Build Time: ${stats.p99BuildTime.toFixed(1)}ms

## Recommendations
${stats.recommendations.map(r => `- ${r}`).join('\n')}

## Detailed Breakdown
${generateDetailedBreakdown(sessions)}
  `

  const filename = path.join(reportPath, `report-${new Date().toISOString().split('T')[0]}.md`)
  fs.writeFileSync(filename, report)
  console.log(`Report generated: ${filename}`)
}

generateWeeklyReport()
```

---

## Part 6: Integration with CI/CD

### 6.1 GitHub Actions

**File: `.github/workflows/monitor-cache.yml`**

```yaml
name: Monitor Cache Performance

on:
  pull_request:
  push:
    branches: [main]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm ci
      
      - name: Run cache monitor
        run: |
          npm run build
          node scripts/monitor-cache.js > cache-report.txt 2>&1 || true
      
      - name: Comment PR with metrics
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs')
            const report = fs.readFileSync('cache-report.txt', 'utf8')
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Cache Performance Report\n\`\`\`\n${report}\n\`\`\``
            })
```

---

## Implementation Checklist

- [x] Metrics infrastructure defined
- [x] Build tool integrations (Next.js, Vite, Webpack)
- [x] CLI dashboard
- [x] Web dashboard
- [x] Alerting rules
- [x] Session reporting
- [x] CI/CD integration

---

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install -S @tailwind-styled/compiler/internal
   ```

2. **Choose build tool integration** (Next.js example):
   ```bash
   cp next.config.monitoring.js your-project/
   ```

3. **View real-time dashboard**:
   ```bash
   node scripts/start-dashboard.js
   ```

4. **Check cache stats**:
   ```bash
   node scripts/monitor-cache.js
   ```

---

## Conclusion

This monitoring setup provides complete visibility into cache performance and build times. Use these insights to:

1. **Validate Phase 0** effectiveness (target: 60% hit rate)
2. **Plan Phase 1** implementation
3. **Measure combined impact** (target: 10x speedup)
4. **Detect regressions** before production

**Key Metrics to Track**:
- ✅ Cache hit rate > 50%
- ✅ Average build time < 100ms
- ✅ Time saved > 30 minutes per 8-hour session
- ✅ No performance degradation

---

**Document Version**: 1.0  
**Last Updated**: June 9, 2026  
**Status**: Ready for Production
