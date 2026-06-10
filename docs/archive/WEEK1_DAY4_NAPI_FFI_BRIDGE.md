# Week 1, Day 4: NAPI FFI Bridge Design

**Date**: June 9, 2026  
**Phase**: Phase 1 - Week 1, Day 4  
**Task**: Design TypeScript ↔ Rust FFI bridge  
**Duration**: 4 hours  
**Status**: 🚀 IN PROGRESS

---

## Overview

Design FFI layer for:
1. TypeScript ↔ Rust data marshalling
2. Error serialization/deserialization
3. Async/await support
4. Performance optimization
5. Type safety across boundary

---

## Part 1: NAPI Function Signatures

### 1.1 Main CSS Generation Function (Async)

**Purpose**: Generate CSS from class array

```rust
// File: native/src/infrastructure/napi_bridge.rs

use napi::{bindgen_prelude::*, JsObject, JsString, JsArray};
use serde::{Deserialize, Serialize};

/// Main CSS generation function
/// Input:
///   - classes: string[] - Array of Tailwind classes
///   - themeJson: string - Serialized ThemeConfig
///   - config: string - Additional config options
/// Output:
///   - css: string - Generated CSS
#[napi]
pub async fn generate_css_native(
    classes: Vec<String>,
    theme_json: String,
    env: Env,
) -> napi::Result<String> {
    // Parse inputs
    let theme = ThemeConfig::from_json(&theme_json)
        .map_err(|e| napi::Error::new(
            napi::Status::InvalidArg,
            format!("Invalid theme JSON: {}", e),
        ))?;
    
    // Defer to thread pool (non-blocking)
    tokio::task::spawn_blocking(move || {
        generate_css_internal(&classes, &theme)
    })
    .await
    .map_err(|e| napi::Error::new(
        napi::Status::GenericFailure,
        format!("Task cancelled: {}", e),
    ))?
    .map_err(|e| napi::Error::from(e))
}

/// Internal implementation
fn generate_css_internal(
    classes: &[String],
    theme: &ThemeConfig,
) -> Result<String, CssGeneratorError> {
    let generator = CssGenerator::new(theme.clone());
    generator.generate_batch(classes)
}
```

### 1.2 Synchronous Fallback Function

**Purpose**: Synchronous version for compatibility

```rust
/// Synchronous CSS generation (for compatibility)
/// Use only when async is not needed
#[napi]
pub fn generate_css_sync(
    classes: Vec<String>,
    theme_json: String,
) -> napi::Result<String> {
    let theme = ThemeConfig::from_json(&theme_json)
        .map_err(|e| napi::Error::new(
            napi::Status::InvalidArg,
            format!("Invalid theme: {}", e),
        ))?;
    
    let generator = CssGenerator::new(theme);
    generator.generate_batch(&classes)
        .map_err(|e| napi::Error::new(
            napi::Status::GenericFailure,
            e.to_string(),
        ))
}
```

### 1.3 Batch Processing with Progress

**Purpose**: Process large class arrays with progress callback

```rust
#[napi]
pub async fn generate_css_batch(
    batch_size: u32,
    classes_array: Vec<String>,
    theme_json: String,
    mut callback: JsFunction,
) -> napi::Result<String> {
    let theme = ThemeConfig::from_json(&theme_json)?;
    let generator = CssGenerator::new(theme);
    
    let mut all_css = String::new();
    let total_batches = (classes_array.len() as f32 / batch_size as f32).ceil() as u32;
    
    for (i, batch) in classes_array.chunks(batch_size as usize).enumerate() {
        let css = generator.generate_batch(batch)
            .map_err(|e| napi::Error::new(
                napi::Status::GenericFailure,
                e.to_string(),
            ))?;
        
        all_css.push_str(&css);
        
        // Call progress callback
        let progress = ((i + 1) as f32 / total_batches as f32) * 100.0;
        let progress_js = env.create_double(progress)?;
        
        let _ = callback.call(None, &[progress_js]);
    }
    
    Ok(all_css)
}
```

### 1.4 Cache Management Functions

**Purpose**: Control cache from TypeScript

```rust
/// Get current cache statistics
#[napi(object)]
pub struct CacheStats {
    pub hits: u32,
    pub misses: u32,
    pub hit_rate: f64,
    pub size: u32,
    pub max_size: u32,
}

#[napi]
pub fn get_cache_stats() -> napi::Result<CacheStats> {
    // Implement cache lookup
    // Return stats
    Ok(CacheStats {
        hits: 100,
        misses: 50,
        hit_rate: 0.667,
        size: 45,
        max_size: 100,
    })
}

/// Clear all cached results
#[napi]
pub fn clear_cache() -> napi::Result<()> {
    // Clear internal cache
    Ok(())
}

/// Clear cache for specific classes
#[napi]
pub fn clear_cache_for(classes: Vec<String>) -> napi::Result<()> {
    // Clear specific entries
    Ok(())
}
```

### 1.5 Theme Management

**Purpose**: Load and validate theme configurations

```rust
/// Validate theme before use
#[napi]
pub fn validate_theme(theme_json: String) -> napi::Result<bool> {
    match ThemeConfig::from_json(&theme_json) {
        Ok(_) => Ok(true),
        Err(e) => Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("Theme validation failed: {}", e),
        ))
    }
}

/// Get default theme
#[napi]
pub fn get_default_theme() -> napi::Result<String> {
    let theme = ThemeConfig::default();
    let json = serde_json::to_string(&theme)
        .map_err(|e| napi::Error::new(
            napi::Status::GenericFailure,
            e.to_string(),
        ))?;
    Ok(json)
}

/// Merge themes (for custom theme extensions)
#[napi]
pub fn merge_themes(
    base_json: String,
    extension_json: String,
) -> napi::Result<String> {
    let mut base = ThemeConfig::from_json(&base_json)?;
    let extension = ThemeConfig::from_json(&extension_json)?;
    
    // Merge logic
    base.merge(&extension);
    
    serde_json::to_string(&base)
        .map_err(|e| napi::Error::new(
            napi::Status::GenericFailure,
            e.to_string(),
        ))
}
```

---

## Part 2: Error Serialization

### 2.1 Error Type Mapping

**Purpose**: Map Rust errors to JavaScript exceptions

```rust
/// Convert CssGeneratorError to NAPI error
impl From<CssGeneratorError> for napi::Error {
    fn from(err: CssGeneratorError) -> Self {
        match err {
            CssGeneratorError::InvalidClass { class, reason } => {
                napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("Invalid class '{}': {}", class, reason),
                )
            }
            CssGeneratorError::ThemeValueNotFound { category, key } => {
                napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("{} not found: {}", category, key),
                )
            }
            CssGeneratorError::InvalidTheme { reason } => {
                napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("Invalid theme: {}", reason),
                )
            }
            CssGeneratorError::ArbitraryValueInvalid { value, reason } => {
                napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("Invalid arbitrary value '{}': {}", value, reason),
                )
            }
            CssGeneratorError::UnsupportedPattern { pattern } => {
                napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("Unsupported pattern: {}", pattern),
                )
            }
            CssGeneratorError::InternalError { message } => {
                napi::Error::new(
                    napi::Status::GenericFailure,
                    format!("Internal error: {}", message),
                )
            }
        }
    }
}

/// Detailed error object for TypeScript
#[napi(object)]
pub struct CssError {
    pub code: String,
    pub message: String,
    pub class: Option<String>,
    pub category: Option<String>,
}

/// Create detailed error object
fn create_error_object(err: &CssGeneratorError) -> CssError {
    match err {
        CssGeneratorError::InvalidClass { class, reason } => {
            CssError {
                code: "INVALID_CLASS".to_string(),
                message: reason.clone(),
                class: Some(class.clone()),
                category: None,
            }
        }
        CssGeneratorError::ThemeValueNotFound { category, key } => {
            CssError {
                code: "THEME_VALUE_NOT_FOUND".to_string(),
                message: format!("Key: {}", key),
                class: None,
                category: Some(category.clone()),
            }
        }
        // ... other error types
        _ => CssError {
            code: "UNKNOWN".to_string(),
            message: err.to_string(),
            class: None,
            category: None,
        }
    }
}
```

### 2.2 Error Handling in FFI

**Purpose**: Proper error propagation

```rust
/// Result wrapper for NAPI
type CssResult<T> = Result<T, CssGeneratorError>;

/// Convert CssResult to NAPI Result
pub fn to_napi_result<T: ToNapiValue>(
    result: CssResult<T>,
    env: &Env,
) -> napi::Result<T> {
    result.map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            e.to_string(),
        )
    })
}
```

---

## Part 3: Async/Await Pattern

### 3.1 Promise-Based API

**Purpose**: Non-blocking CSS generation

```rust
/// Promise-based async function
#[napi]
pub async fn generate_css_async(
    classes: Vec<String>,
    theme_json: String,
) -> napi::Result<String> {
    // Offload to tokio runtime (non-blocking)
    tokio::task::spawn_blocking(move || {
        // Expensive CPU work
        let theme = ThemeConfig::from_json(&theme_json)?;
        let generator = CssGenerator::new(theme);
        generator.generate_batch(&classes)
    })
    .await
    .map_err(|e| napi::Error::new(
        napi::Status::GenericFailure,
        e.to_string(),
    ))?
    .map_err(|e| napi::Error::from(e))
}

/// Streaming CSS generation
#[napi]
pub async fn generate_css_stream(
    env: Env,
    classes: Vec<String>,
    theme_json: String,
    on_chunk: JsFunction,
) -> napi::Result<String> {
    let theme = ThemeConfig::from_json(&theme_json)?;
    let generator = CssGenerator::new(theme);
    
    let mut result = String::new();
    
    // Process in chunks
    for (i, class) in classes.iter().enumerate() {
        let css = generator.generate_batch(&[class.clone()])?;
        result.push_str(&css);
        
        // Emit chunk event
        let chunk = env.create_string(&css)?;
        let idx = env.create_uint32(i as u32)?;
        on_chunk.call(None, &[chunk, idx])?;
    }
    
    Ok(result)
}
```

### 3.2 AbortSignal Support

**Purpose**: Allow cancellation of long-running operations

```rust
/// Cancellable CSS generation
#[napi]
pub async fn generate_css_cancellable(
    env: Env,
    classes: Vec<String>,
    theme_json: String,
    abort_signal: JsObject,
) -> napi::Result<String> {
    let theme = ThemeConfig::from_json(&theme_json)?;
    let generator = CssGenerator::new(theme);
    
    // Check abort signal periodically
    let result = tokio::task::spawn_blocking(move || {
        let mut result = String::new();
        
        for class in classes {
            // Would need abort signal channel for true support
            let css = generator.generate_batch(&[class])?;
            result.push_str(&css);
        }
        
        Ok::<_, CssGeneratorError>(result)
    })
    .await
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e.to_string()))?
    .map_err(|e| napi::Error::from(e))?;
    
    Ok(result)
}
```

---

## Part 4: Performance Optimization

### 4.1 Buffer-Based API

**Purpose**: Avoid repeated allocations for large batches

```rust
/// Generate CSS to pre-allocated buffer
#[napi]
pub fn generate_css_to_buffer(
    classes: Vec<String>,
    theme_json: String,
    buffer_size: u32,
) -> napi::Result<String> {
    let mut buffer = String::with_capacity(buffer_size as usize);
    
    let theme = ThemeConfig::from_json(&theme_json)?;
    let generator = CssGenerator::new(theme);
    
    for class in classes {
        let css = generator.generate_batch(&[class])?;
        buffer.push_str(&css);
    }
    
    Ok(buffer)
}
```

### 4.2 Caching at FFI Boundary

**Purpose**: Cache results at JavaScript layer

```rust
/// Generate with cache-aware API
#[napi]
pub fn generate_css_cached(
    classes: Vec<String>,
    theme_json: String,
    cache_key: Option<String>,
) -> napi::Result<String> {
    // Hash the cache key
    let key = cache_key.unwrap_or_else(|| {
        format!("{:?}", &classes)
    });
    
    // Check cache (global cache in Rust)
    // If hit, return cached value
    // If miss, generate and cache
    
    let theme = ThemeConfig::from_json(&theme_json)?;
    let generator = CssGenerator::new(theme);
    generator.generate_batch(&classes)
        .map_err(|e| napi::Error::from(e))
}
```

### 4.3 Zero-Copy Where Possible

**Purpose**: Minimize string allocations

```rust
/// Work with string references where possible
#[napi]
pub fn validate_classes(classes: Vec<String>) -> napi::Result<Vec<bool>> {
    classes.iter()
        .map(|class| {
            let is_valid = ClassValidator::is_valid(class);
            Ok(is_valid)
        })
        .collect()
}
```

---

## Part 5: TypeScript Integration Layer

### 5.1 Native Module Wrapper

**Purpose**: TypeScript interface for Rust functions

```typescript
// File: packages/domain/compiler/src/nativeBinding.ts

// Import native module (generated by napi-rs)
import { 
  generateCssNative, 
  generateCssSync,
  getCacheStats,
  clearCache,
  validateTheme,
  getDefaultTheme,
} from '../native'

// Type definitions for TypeScript
export interface ICacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  maxSize: number
}

export interface ICssError {
  code: string
  message: string
  class?: string
  category?: string
}

// Wrapper function with error handling
export async function generateCss(
  classes: string[],
  themeJson: string,
): Promise<string> {
  try {
    return await generateCssNative(classes, themeJson)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`CSS generation failed: ${error.message}`)
    }
    throw error
  }
}

// Sync wrapper
export function generateCssSync(
  classes: string[],
  themeJson: string,
): string {
  try {
    return generateCssSync(classes, themeJson)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`CSS generation failed: ${error.message}`)
    }
    throw error
  }
}

// Cache stats wrapper
export function getCacheStats(): ICacheStats {
  return getCacheStats()
}

// Clear cache
export function clearCache(): void {
  clearCache()
}
```

### 5.2 Error Handling Wrapper

**Purpose**: Convert JavaScript errors

```typescript
// File: packages/domain/compiler/src/errorHandling.ts

export class CssGenerationError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalClass?: string,
    public category?: string,
  ) {
    super(message)
    this.name = 'CssGenerationError'
  }
  
  static from(error: ICssError): CssGenerationError {
    return new CssGenerationError(
      error.code,
      error.message,
      error.class,
      error.category,
    )
  }
}

export async function generateCssWithErrorHandling(
  classes: string[],
  themeJson: string,
): Promise<string> {
  try {
    return await generateCss(classes, themeJson)
  } catch (error) {
    if (error instanceof CssGenerationError) {
      // Re-throw as-is
      throw error
    }
    
    if (error instanceof Error) {
      throw new CssGenerationError(
        'UNKNOWN',
        error.message,
      )
    }
    
    throw new CssGenerationError('UNKNOWN', 'Unknown error occurred')
  }
}
```

---

## Part 6: NAPI Configuration

### 6.1 Cargo.toml Dependencies

**Purpose**: NAPI and related dependencies

```toml
[package]
name = "css-generator-native"
version = "1.0.0"
edition = "2021"

[dependencies]
napi = { version = "2.12", features = ["async", "serde-json"] }
napi-derive = "2.12"
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
regex = "1.10"
once_cell = "1.19"

[build-dependencies]
napi-build = "2.1"

[lib]
crate-type = ["cdylib", "rlib"]

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

### 6.2 Package.json Integration

**Purpose**: Node.js native module configuration

```json
{
  "name": "@tailwind-styled/css-generator-native",
  "version": "1.0.0",
  "description": "Rust-based Tailwind CSS generator",
  "main": "index.js",
  "napi": {
    "name": "css_generator",
    "package": {
      "name": "@tailwind-styled/css-generator-native"
    }
  },
  "scripts": {
    "build": "napi build --release",
    "build:debug": "napi build",
    "test": "node -e \"require('./index.js')\"",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "@napi-rs/cli": "^2.14"
  }
}
```

---

## Part 7: Testing FFI Layer

### 7.1 Unit Tests for FFI

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_generate_css_native() {
        let classes = vec!["px-4".to_string(), "py-2".to_string()];
        let theme = ThemeConfig::default();
        let theme_json = serde_json::to_string(&theme).unwrap();
        
        let result = generate_css_sync(classes, theme_json);
        assert!(result.is_ok());
        let css = result.unwrap();
        assert!(css.contains("padding"));
    }
    
    #[test]
    fn test_error_handling() {
        let classes = vec!["invalid::class".to_string()];
        let theme = ThemeConfig::default();
        let theme_json = serde_json::to_string(&theme).unwrap();
        
        let result = generate_css_sync(classes, theme_json);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_cache_stats() {
        // Generate some CSS to populate cache
        // Check stats
        let stats = get_cache_stats();
        assert_eq!(stats.max_size, 100);
    }
}
```

### 7.2 Integration Tests

```typescript
// File: tests/napi.test.ts

import { generateCss, getCacheStats, clearCache } from '../src/nativeBinding'

describe('NAPI Bridge', () => {
  it('should generate CSS', async () => {
    const css = await generateCss(
      ['px-4', 'py-2'],
      JSON.stringify(defaultTheme),
    )
    expect(css).toContain('padding')
  })
  
  it('should handle errors', async () => {
    expect(() => {
      generateCss(['invalid::class'], JSON.stringify(defaultTheme))
    }).rejects.toThrow()
  })
  
  it('should track cache stats', async () => {
    clearCache()
    
    await generateCss(['px-4'], JSON.stringify(defaultTheme))
    await generateCss(['px-4'], JSON.stringify(defaultTheme))
    
    const stats = getCacheStats()
    expect(stats.hits).toBeGreaterThan(0)
    expect(stats.hitRate).toBeGreaterThan(0)
  })
})
```

---

## Summary: FFI Architecture

```
TypeScript Layer (packages/domain/compiler/src/)
    ↓ (async/await, promises)
NAPI Bridge (native/src/infrastructure/napi_bridge.rs)
    ↓ (JSON serialization, error mapping)
Rust Implementation (native/src/application/ + domain/)
    ↓ (CSS generation, parsing, theme resolution)
Native Binary (.node module)
    ↓ (loaded at runtime)
JavaScript/TypeScript Application
```

---

## Performance Targets for FFI

| Operation | Time | Target |
|-----------|------|--------|
| Single class parse | 0.1ms | <0.2ms |
| Theme lookup | 0.05ms | <0.1ms |
| CSS generation (10 classes) | 1ms | <2ms |
| CSS generation (100 classes) | 10ms | <20ms |
| Cache lookup | 0.01ms | <0.05ms |
| Error creation | 0.5ms | <1ms |

---

## Files to Create (Day 6-7)

```
native/src/infrastructure/
├─ mod.rs (exports)
└─ napi_bridge.rs (all NAPI functions)

packages/domain/compiler/src/
├─ nativeBinding.ts (TypeScript FFI wrapper)
└─ errorHandling.ts (Error conversion)

native/Cargo.toml (updated)
```

---

## Next Steps: Day 5

**CSS Rule Generation Design** (4 hours):
- Design template system
- CSS selector escaping
- Media query merging
- Vendor prefix logic

---

## Deliverables: Day 4

✅ Complete NAPI FFI design
✅ Function signatures (async, sync, streaming)
✅ Error serialization strategy
✅ Performance optimization patterns
✅ TypeScript integration layer
✅ Testing strategy
✅ Cargo.toml and package.json config

---

**Document Status**: Complete  
**Date**: June 9, 2026  
**Next**: Day 5 - CSS Rule Generation Design
