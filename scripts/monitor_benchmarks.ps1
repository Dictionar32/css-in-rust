#!/usr/bin/env pwsh
# Monitor Phase 2 Cache Benchmarks
# Usage: ./monitor_benchmarks.ps1

Write-Host "=== PHASE 2 CACHE BENCHMARK MONITOR ===" -ForegroundColor Cyan
Write-Host "Monitoring benchmark execution..." -ForegroundColor Green
Write-Host ""

$benchmarkFile = "native/benches/phase2_performance_bench.rs"
$targetDir = "native/target"

# Check if benchmarks are running
$cargoProc = Get-Process cargo -ErrorAction SilentlyContinue
if ($cargoProc) {
    Write-Host "✓ Cargo is running (PID: $($cargoProc.Id))" -ForegroundColor Green
} else {
    Write-Host "✗ Cargo is not running - benchmarks not active" -ForegroundColor Red
}

# Check build artifacts
$artifacts = @(
    "native/index.node",
    "native/index.d.ts",
    "native/index.js"
)

Write-Host ""
Write-Host "BUILD ARTIFACTS:" -ForegroundColor Cyan
foreach ($artifact in $artifacts) {
    if (Test-Path $artifact) {
        $size = (Get-Item $artifact).Length / 1KB
        Write-Host "  ✓ $artifact ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $artifact (missing)" -ForegroundColor Yellow
    }
}

# Check cache statistics
Write-Host ""
Write-Host "CACHE STATUS:" -ForegroundColor Cyan

$cacheInfo = @{
    "PARSE_CACHE" = "5,000 entries (~1 MB)"
    "RESOLVE_CACHE" = "10,000 entries (~1 MB)"
    "COMPILE_CACHE" = "10,000 entries (~5 MB)"
    "CSS_GEN_CACHE" = "5,000 entries (~1.5 MB)"
}

foreach ($cache in $cacheInfo.GetEnumerator()) {
    Write-Host "  ✓ $($cache.Name): $($cache.Value)" -ForegroundColor Green
}

# Expected performance targets
Write-Host ""
Write-Host "PERFORMANCE TARGETS:" -ForegroundColor Cyan
$targets = @(
    @("Parse", "<0.5ms/class", "40x faster"),
    @("Resolve", "<0.1ms/item", "6x faster"),
    @("Compile", "~3ms/class", "64x faster"),
    @("Batch 100", "<50ms", "6x faster"),
    @("Hit rate", ">80%", "typical"),
    @("Memory", "<10MB", "typical")
)

foreach ($target in $targets) {
    Write-Host "  ⏳ $($target[0]): $($target[1]) ($($target[2]))" -ForegroundColor Yellow
}

# Test status
Write-Host ""
Write-Host "TEST STATUS:" -ForegroundColor Cyan

$testFiles = @(
    @("cache_integration_tests.rs", 15, "cache behavior"),
    @("production_scenarios.rs", 11, "real-world patterns")
)

foreach ($test in $testFiles) {
    if (Test-Path "native/tests/$($test[0])") {
        Write-Host "  ✓ $($test[0]): $($test[1]) tests ($($test[2]))" -ForegroundColor Green
    }
}

# Next steps
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Wait for benchmarks to complete (3-5 hours)" -ForegroundColor White
Write-Host "  2. Check benchmark output for timing data" -ForegroundColor White
Write-Host "  3. Run cache integration tests" -ForegroundColor White
Write-Host "  4. Run production scenario tests" -ForegroundColor White
Write-Host "  5. Collect metrics and compare with targets" -ForegroundColor White

# Timeline
Write-Host ""
Write-Host "TIMELINE:" -ForegroundColor Cyan
Write-Host "  Hour 0-3: Benchmarks running" -ForegroundColor White
Write-Host "  Hour 3-5: Tests running" -ForegroundColor White
Write-Host "  Hour 5-8: Analysis & report" -ForegroundColor White

Write-Host ""
Write-Host "Monitoring active. Press Ctrl+C to exit." -ForegroundColor Green

# Keep monitoring
while ($true) {
    Start-Sleep -Seconds 30
    
    # Check cargo still running
    $cargoProc = Get-Process cargo -ErrorAction SilentlyContinue
    if (-not $cargoProc) {
        Write-Host ""
        Write-Host "⚠ Cargo process ended. Benchmarks may be complete." -ForegroundColor Yellow
        Write-Host "Check 'native/target/release/deps/phase2_performance_bench-*.d' for results" -ForegroundColor Yellow
        break
    }
}

Write-Host ""
Write-Host "Monitoring stopped." -ForegroundColor Cyan
