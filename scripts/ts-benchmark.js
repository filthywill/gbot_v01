/**
 * TypeScript Performance Benchmark Script
 * Cross-platform script for measuring TypeScript compilation performance
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Performance measurement utility
function measureTime(label, fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

// Clean TypeScript build cache
function cleanBuildCache() {
  const buildInfoDir = '.tsbuildinfo';
  if (fs.existsSync(buildInfoDir)) {
    fs.rmSync(buildInfoDir, { recursive: true, force: true });
    console.log('✅ TypeScript build cache cleared');
  }
}

// Get build info file size
function getBuildInfoSize() {
  const buildInfoDir = '.tsbuildinfo';
  if (!fs.existsSync(buildInfoDir)) return 0;
  
  let totalSize = 0;
  const files = fs.readdirSync(buildInfoDir);
  
  for (const file of files) {
    const filePath = path.join(buildInfoDir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  }
  
  return totalSize;
}

// Run TypeScript type check
function runTypeCheck(isIncremental = false) {
  try {
    // Use tsc with specific project files to enable build info generation
    const command = isIncremental 
      ? 'npx tsc -p tsconfig.app.json --noEmit --incremental'
      : 'npx tsc -p tsconfig.app.json --noEmit';
    
    execSync(command, { stdio: 'pipe' });
    return { success: true, errors: 0 };
  } catch (error) {
    // Parse TypeScript errors
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorMatches = output.match(/\(\d+,\d+\):\s*error/g) || [];
    return { success: false, errors: errorMatches.length };
  }
}

// Main benchmark function
async function runBenchmark() {
  console.log('🚀 TypeScript Performance Benchmark Starting...\n');
  
  const results = {
    fullBuild: null,
    incrementalBuild: null,
    buildCacheSize: 0,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    }
  };

  // Step 1: Clean build and measure full compilation
  console.log('📊 Step 1: Full TypeScript compilation (cold cache)');
  cleanBuildCache();
  
  const fullBuildResult = measureTime('Full type check', () => runTypeCheck(false));
  results.fullBuild = {
    duration: fullBuildResult.duration,
    success: fullBuildResult.result.success,
    errors: fullBuildResult.result.errors
  };

  // Step 1.5: Run incremental check to create build cache
  console.log('\n📊 Step 1.5: Creating incremental cache...');
  runTypeCheck(true);

  // Step 2: Make a small change and measure incremental compilation
  console.log('\n📊 Step 2: Incremental TypeScript compilation (warm cache)');
  
  // Create a temporary comment change to trigger incremental compilation
  const tempFile = 'src/temp-benchmark-trigger.ts';
  fs.writeFileSync(tempFile, `// Benchmark timestamp: ${Date.now()}\nexport {};\n`);
  
  const incrementalBuildResult = measureTime('Incremental type check', () => runTypeCheck(true));
  
  // Clean up temp file
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
  
  results.incrementalBuild = {
    duration: incrementalBuildResult.duration,
    success: incrementalBuildResult.result.success,
    errors: incrementalBuildResult.result.errors
  };

  // Step 3: Measure build cache size
  results.buildCacheSize = getBuildInfoSize();
  console.log(`\n📁 Build cache size: ${(results.buildCacheSize / 1024).toFixed(2)} KB`);

  // Step 4: Calculate speedup
  const speedup = results.fullBuild.duration > 0 
    ? ((results.fullBuild.duration - results.incrementalBuild.duration) / results.fullBuild.duration) * 100
    : 0;

  // Step 5: Display results
  console.log('\n🎯 Performance Results:');
  console.log('━'.repeat(50));
  console.log(`Full Build:        ${results.fullBuild.duration.toFixed(2)}ms`);
  console.log(`Incremental Build: ${results.incrementalBuild.duration.toFixed(2)}ms`);
  console.log(`Speedup:           ${speedup.toFixed(1)}% faster`);
  console.log(`Errors:            ${results.incrementalBuild.errors}`);
  console.log(`Cache Size:        ${(results.buildCacheSize / 1024).toFixed(2)} KB`);

  // Step 6: Performance analysis
  console.log('\n📈 Performance Analysis:');
  if (speedup > 50) {
    console.log('🚀 Excellent! Incremental compilation is highly effective');
  } else if (speedup > 25) {
    console.log('⚡ Good incremental compilation performance');
  } else if (speedup > 10) {
    console.log('🐌 Moderate speedup - consider optimization');
  } else {
    console.log('🚨 Poor incremental performance - check configuration');
  }

  // Step 7: Save results
  const resultsFile = '.tsbuildinfo/benchmark-results.json';
  fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  return results;
}

// Run the benchmark
runBenchmark().catch(console.error); 