#!/usr/bin/env node

/**
 * Simple test script to verify NAPI binding works from Node.js
 */

const path = require('path');

try {
  // Try to load the native binding
  const nativeBinding = require('./native/tailwind-styled-native.node');
  
  console.log('✅ Native binding loaded successfully');
  console.log('Available exports:', Object.keys(nativeBinding));
  
  // Test 1: Call generate_css_native if it exists
  if (nativeBinding.generate_css_native) {
    console.log('\n--- Test 1: generate_css_native ---');
    
    const testTheme = JSON.stringify({
      colors: {
        blue: { "600": "#1e40af" }
      },
      spacing: {
        "4": "1rem"
      }
    });
    
    const testClasses = ["bg-blue-600", "px-4"];
    
    try {
      const result = nativeBinding.generate_css_native(testClasses, testTheme);
      console.log('✅ generate_css_native executed successfully');
      console.log('CSS Output length:', result.length, 'bytes');
      console.log('First 200 chars:', result.substring(0, 200));
    } catch (error) {
      console.log('❌ generate_css_native failed:', error.message);
    }
  } else {
    console.log('⚠️  generate_css_native not found in exports');
  }
  
  // Test 2: Call get_cache_stats if it exists
  if (nativeBinding.get_cache_stats) {
    console.log('\n--- Test 2: get_cache_stats ---');
    try {
      const stats = nativeBinding.get_cache_stats();
      console.log('✅ get_cache_stats executed successfully');
      console.log('Cache stats:', stats);
    } catch (error) {
      console.log('❌ get_cache_stats failed:', error.message);
    }
  } else {
    console.log('⚠️  get_cache_stats not found in exports');
  }
  
  // Test 3: Call clear_theme_cache if it exists
  if (nativeBinding.clear_theme_cache) {
    console.log('\n--- Test 3: clear_theme_cache ---');
    try {
      nativeBinding.clear_theme_cache();
      console.log('✅ clear_theme_cache executed successfully');
    } catch (error) {
      console.log('❌ clear_theme_cache failed:', error.message);
    }
  } else {
    console.log('⚠️  clear_theme_cache not found in exports');
  }
  
  // Test 4: Error handling - invalid JSON theme
  if (nativeBinding.generate_css_native) {
    console.log('\n--- Test 4: Error handling (invalid JSON) ---');
    try {
      nativeBinding.generate_css_native(["test"], "invalid json");
      console.log('❌ Should have thrown an error for invalid JSON');
    } catch (error) {
      console.log('✅ Error handling works correctly');
      console.log('Error message:', error.message);
    }
  }
  
  console.log('\n🎉 NAPI binding tests completed');
  
} catch (error) {
  console.error('❌ Failed to load native binding:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}
