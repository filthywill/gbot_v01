/**
 * TypeScript Development Monitor
 * Integrates performance monitoring with development workflows
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Import our performance monitor (simulated since we're in Node.js context)
class TypeScriptMonitor {
  constructor() {
    this.metrics = [];
    this.thresholds = {
      slowBuild: 5000,    // 5 seconds
      fastBuild: 1000,    // 1 second
      largeCacheSize: 500 * 1024, // 500KB
    };
    this.loadExistingMetrics();
  }

  loadExistingMetrics() {
    try {
      const metricsFile = '.tsbuildinfo/ts-monitor-metrics.json';
      if (fs.existsSync(metricsFile)) {
        const data = fs.readFileSync(metricsFile, 'utf8');
        this.metrics = JSON.parse(data);
        console.log(`📊 Loaded ${this.metrics.length} existing metrics`);
      }
    } catch (error) {
      console.log('📊 Starting fresh metrics collection');
      this.metrics = [];
    }
  }

  async recordMetrics(duration, errors, warnings, isIncremental, cacheSize) {
    const metric = {
      timestamp: Date.now(),
      duration,
      errors,
      warnings,
      isIncremental,
      cacheSize,
      date: new Date().toISOString()
    };

    this.metrics.push(metric);
    this.analyzePerformance(metric);
    this.saveMetrics();
  }

  analyzePerformance(metric) {
    console.log('\n📊 TypeScript Performance Monitor');
    console.log('━'.repeat(40));
    
    // Duration analysis
    if (metric.duration > this.thresholds.slowBuild) {
      console.log('🐌 SLOW BUILD DETECTED');
      console.log(`   Duration: ${metric.duration}ms (>${this.thresholds.slowBuild}ms threshold)`);
      console.log('   💡 Consider: Reducing project complexity or optimizing imports');
    } else if (metric.duration < this.thresholds.fastBuild) {
      console.log('🚀 FAST BUILD');
      console.log(`   Duration: ${metric.duration}ms (<${this.thresholds.fastBuild}ms)`);
    } else {
      console.log('⚡ NORMAL BUILD');
      console.log(`   Duration: ${metric.duration}ms`);
    }

    // Error analysis
    if (metric.errors > 0) {
      console.log(`❌ ${metric.errors} TypeScript errors found`);
      console.log('   💡 Run `npm run ts:check:verbose` for details');
    } else {
      console.log('✅ No TypeScript errors');
    }

    // Cache analysis
    if (metric.cacheSize > this.thresholds.largeCacheSize) {
      console.log(`💾 Large cache size: ${(metric.cacheSize / 1024).toFixed(1)}KB`);
      console.log('   💡 Consider: Running `npm run ts:clean` occasionally');
    }

    // Incremental analysis
    if (metric.isIncremental) {
      const recentMetrics = this.metrics.slice(-5);
      const avgIncremental = recentMetrics
        .filter(m => m.isIncremental)
        .reduce((sum, m) => sum + m.duration, 0) / recentMetrics.filter(m => m.isIncremental).length;
      
      const avgFull = recentMetrics
        .filter(m => !m.isIncremental)
        .reduce((sum, m) => sum + m.duration, 0) / recentMetrics.filter(m => !m.isIncremental).length;

      if (avgFull && avgIncremental) {
        const speedup = ((avgFull - avgIncremental) / avgFull) * 100;
        console.log(`📈 Incremental speedup: ${speedup.toFixed(1)}%`);
      }
    }
  }

  saveMetrics() {
    const metricsFile = '.tsbuildinfo/ts-monitor-metrics.json';
    fs.mkdirSync(path.dirname(metricsFile), { recursive: true });
    
    // Keep only last 50 metrics to prevent file from growing too large
    const recentMetrics = this.metrics.slice(-50);
    fs.writeFileSync(metricsFile, JSON.stringify(recentMetrics, null, 2));
  }

  generateReport() {
    console.log('\n📋 TypeScript Performance Report');
    console.log('━'.repeat(50));
    
    if (this.metrics.length === 0) {
      console.log('No metrics collected yet. Run some TypeScript checks first.');
      return;
    }

    const recent = this.metrics.slice(-10);
    const avgDuration = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    const errorRate = recent.filter(m => m.errors > 0).length / recent.length;
    const incrementalMetrics = recent.filter(m => m.isIncremental);
    const fullMetrics = recent.filter(m => !m.isIncremental);

    console.log(`Average Duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`Error Rate: ${(errorRate * 100).toFixed(1)}%`);
    console.log(`Incremental Builds: ${incrementalMetrics.length}/${recent.length}`);
    
    if (incrementalMetrics.length > 0 && fullMetrics.length > 0) {
      const avgIncremental = incrementalMetrics.reduce((sum, m) => sum + m.duration, 0) / incrementalMetrics.length;
      const avgFull = fullMetrics.reduce((sum, m) => sum + m.duration, 0) / fullMetrics.length;
      const speedup = ((avgFull - avgIncremental) / avgFull) * 100;
      console.log(`Incremental Speedup: ${speedup.toFixed(1)}%`);
    }

    // Performance trend
    if (recent.length >= 5) {
      const first5 = recent.slice(0, 5);
      const last5 = recent.slice(-5);
      const firstAvg = first5.reduce((sum, m) => sum + m.duration, 0) / first5.length;
      const lastAvg = last5.reduce((sum, m) => sum + m.duration, 0) / last5.length;
      const trend = ((lastAvg - firstAvg) / firstAvg) * 100;
      
      console.log(`Performance Trend: ${trend > 0 ? '📈' : '📉'} ${Math.abs(trend).toFixed(1)}% ${trend > 0 ? 'slower' : 'faster'}`);
    }
  }
}

// Monitor instance
const monitor = new TypeScriptMonitor();

// Run TypeScript check with monitoring
async function runMonitoredTypeCheck(isIncremental = true) {
  const start = process.hrtime.bigint();
  
  try {
    const command = isIncremental 
      ? 'npx tsc -p tsconfig.app.json --noEmit --incremental'
      : 'npx tsc -p tsconfig.app.json --noEmit';
    
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    
    // Get cache size
    const cacheSize = getCacheSize();
    
    await monitor.recordMetrics(duration, 0, 0, isIncremental, cacheSize);
    console.log(`✅ TypeScript check completed in ${duration.toFixed(0)}ms`);
    
  } catch (error) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    
    // Parse errors from output
    const output = error.stdout || error.stderr || '';
    const errors = (output.match(/error TS\d+:/g) || []).length;
    const warnings = (output.match(/warning TS\d+:/g) || []).length;
    
    const cacheSize = getCacheSize();
    
    await monitor.recordMetrics(duration, errors, warnings, isIncremental, cacheSize);
    console.log(`❌ TypeScript check completed with ${errors} errors in ${duration.toFixed(0)}ms`);
    
    if (errors > 0) {
      console.log('\nFirst few errors:');
      const errorLines = output.split('\n').filter(line => line.includes('error TS')).slice(0, 3);
      errorLines.forEach(line => console.log(`  ${line.trim()}`));
    }
  }
}

function getCacheSize() {
  try {
    const buildInfoDir = '.tsbuildinfo';
    if (!fs.existsSync(buildInfoDir)) return 0;
    
    let totalSize = 0;
    const files = fs.readdirSync(buildInfoDir);
    
    for (const file of files) {
      if (file.endsWith('.tsbuildinfo')) {
        const filePath = path.join(buildInfoDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  } catch {
    return 0;
  }
}

// CLI interface
const command = process.argv[2] || 'check';

switch (command) {
  case 'check':
    console.log('🔍 Running monitored TypeScript check...');
    runMonitoredTypeCheck(true);
    break;
    
  case 'full':
    console.log('🔍 Running full TypeScript check...');
    runMonitoredTypeCheck(false);
    break;
    
  case 'report':
    monitor.generateReport();
    break;
    
  default:
    console.log('Usage: node scripts/ts-monitor.js [check|full|report]');
} 