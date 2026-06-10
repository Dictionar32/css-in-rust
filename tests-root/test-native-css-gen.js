#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const nativeBinding = require('./native/tailwind-styled-native.node');

console.log('🚀 Testing generateCssNative from native binding\n');

if (nativeBinding.generateCssNative) {
  try {
    // Test 1: Basic usage
    console.log('--- Test 1: Basic generation ---');
    const testTheme = JSON.stringify({
      colors: {
        blue: { "600": "#1e40af" },
        red: { "500": "#ef4444" }
      },
      spacing: {
        "4": "1rem",
        "8": "2rem"
      },
      font_sizes: {
        "sm": ["0.875rem", "1.25rem"]
      },
      opacity: {
        "50": "0.5"
      },
      breakpoints: {
        "sm": "640px"
      },
      extend: {},
      dark_mode: "media"
    });
    
    const testClasses = ["bg-blue-600", "px-4"];
    
    try {
      const result = nativeBinding.generateCssNative(testClasses, testTheme);
      console.log('✅ generateCssNative succeeded');
      console.log('Generated CSS length:', result.length, 'bytes');
      console.log('Output preview:', result.substring(0, 300));
      console.log('...');
    } catch (error) {
      console.log('❌ generateCssNative error:', error.message);
    }
    
    // Test 2: Error handling with invalid JSON
    console.log('\n--- Test 2: Error handling (invalid JSON) ---');
    try {
      nativeBinding.generateCssNative(["test"], "not valid json");
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.log('✅ Error caught correctly:', error.message);
    }
    
    // Test 3: Empty class list
    console.log('\n--- Test 3: Empty class list ---');
    try {
      const result = nativeBinding.generateCssNative([], testTheme);
      console.log('✅ Empty list handled:', result.substring(0, 100));
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
  } catch (e) {
    console.log('Unexpected error:', e);
  }
} else {
  console.log('❌ generateCssNative not found in exports');
}

console.log('\n✨ Tests completed');
