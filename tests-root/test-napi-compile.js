#!/usr/bin/env node

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nativeBinding = require('./native/tailwind-styled-native.node');

console.log('Testing compileCss from native binding');

if (nativeBinding.compileCss) {
  try {
    // Test with simple test data
    const testInput = "px-4 bg-blue-600 hover:opacity-50";
    const result = nativeBinding.compileCss(testInput, null);
    
    console.log('✅ compileCss executed');
    console.log('Input:', testInput);
    console.log('Result type:', typeof result);
    console.log('Result:', result);
  } catch (e) {
    console.log('Error:', e.message);
  }
} else {
  console.log('compileCss not found');
}

// List all exports that start with 'css' or 'compile'
const exports = Object.keys(nativeBinding);
const relevant = exports.filter(name => 
  name.toLowerCase().includes('css') || 
  name.toLowerCase().includes('compile') ||
  name.toLowerCase().includes('generate')
);

console.log('\nRelevant exports:', relevant);
