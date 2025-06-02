/**
 * TypeScript Performance Monitor
 * 
 * Monitors and tracks TypeScript compilation performance, type checking speeds,
 * and development workflow metrics for Phase 3 optimization.
 */

export interface TypeCheckMetrics {
  duration: number;
  fileCount: number;
  errorCount: number;
  warningCount: number;
  timestamp: number;
  isIncremental: boolean;
  buildInfoSize?: number;
}

export interface PerformanceSnapshot {
  compilation: TypeCheckMetrics;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  system: {
    platform: string;
    nodeVersion: string;
    typescriptVersion: string;
  };
}

export interface PerformanceTrend {
  metric: keyof TypeCheckMetrics;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  samples: number;
}

class TypeScriptPerformanceMonitor {
  private metrics: TypeCheckMetrics[] = [];
  private readonly maxSamples = 100;
  private readonly storageKey = 'ts-performance-metrics';

  constructor() {
    this.loadStoredMetrics();
  }

  /**
   * Record a type checking performance measurement
   */
  recordTypeCheck(metrics: Omit<TypeCheckMetrics, 'timestamp'>): void {
    const fullMetrics: TypeCheckMetrics = {
      ...metrics,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetrics);

    // Keep only the most recent samples
    if (this.metrics.length > this.maxSamples) {
      this.metrics = this.metrics.slice(-this.maxSamples);
    }

    this.saveMetrics();
    this.logPerformanceUpdate(fullMetrics);
  }

  /**
   * Get performance statistics over time
   */
  getPerformanceStats(): {
    recent: TypeCheckMetrics | null;
    average: Partial<TypeCheckMetrics>;
    trend: PerformanceTrend[];
    incrementalSpeedup: number | null;
  } {
    if (this.metrics.length === 0) {
      return {
        recent: null,
        average: {},
        trend: [],
        incrementalSpeedup: null
      };
    }

    // Safe array access with enhanced type safety - explicit null check
    const lastIndex = this.metrics.length - 1;
    const recent: TypeCheckMetrics | null = lastIndex >= 0 ? (this.metrics[lastIndex] ?? null) : null;
    const average = this.calculateAverages();
    const trend = this.calculateTrends();
    const incrementalSpeedup = this.calculateIncrementalSpeedup();

    return {
      recent,
      average,
      trend,
      incrementalSpeedup
    };
  }

  /**
   * Create a complete performance snapshot
   */
  createSnapshot(): PerformanceSnapshot {
    const stats = this.getPerformanceStats();
    const recent = stats.recent || this.createEmptyMetrics();

    return {
      compilation: recent,
      memory: this.getMemoryUsage(),
      system: this.getSystemInfo()
    };
  }

  /**
   * Analyze performance and provide recommendations
   */
  analyzePerformance(): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
    metrics: {
      averageTypeCheckTime: number;
      incrementalSpeedup: number | null;
      errorRate: number;
    };
  } {
    const stats = this.getPerformanceStats();
    const avgDuration = stats.average.duration || 0;
    const incrementalSpeedup = stats.incrementalSpeedup || 0;
    const errorRate = this.calculateErrorRate();

    let status: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    const recommendations: string[] = [];

    // Analyze type check speed
    if (avgDuration > 5000) {
      status = 'poor';
      recommendations.push('Consider optimizing TypeScript configuration or reducing project complexity');
    } else if (avgDuration > 2000) {
      status = 'fair';
      recommendations.push('Type checking could be faster - review advanced compiler options');
    } else if (avgDuration < 500) {
      status = 'excellent';
    }

    // Analyze incremental compilation effectiveness
    if (incrementalSpeedup < 0.3) {
      recommendations.push('Incremental compilation not providing expected speedup - check build cache');
    } else if (incrementalSpeedup > 0.6) {
      recommendations.push('Excellent incremental compilation performance!');
    }

    // Analyze error rate
    if (errorRate > 0.1) {
      recommendations.push('High error rate detected - consider reviewing code quality practices');
    }

    return {
      status,
      recommendations,
      metrics: {
        averageTypeCheckTime: avgDuration,
        incrementalSpeedup,
        errorRate
      }
    };
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    metrics: TypeCheckMetrics[];
    analysis: ReturnType<TypeScriptPerformanceMonitor['analyzePerformance']>;
    snapshot: PerformanceSnapshot;
  } {
    return {
      metrics: this.metrics,
      analysis: this.analyzePerformance(),
      snapshot: this.createSnapshot()
    };
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.saveMetrics();
  }

  // Private methods

  private loadStoredMetrics(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored TypeScript metrics:', error);
      this.metrics = [];
    }
  }

  private saveMetrics(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to save TypeScript metrics:', error);
    }
  }

  private calculateAverages(): Partial<TypeCheckMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        duration: acc.duration + metric.duration,
        fileCount: acc.fileCount + metric.fileCount,
        errorCount: acc.errorCount + metric.errorCount,
        warningCount: acc.warningCount + metric.warningCount
      }),
      { duration: 0, fileCount: 0, errorCount: 0, warningCount: 0 }
    );

    const count = this.metrics.length;
    return {
      duration: Math.round(totals.duration / count),
      fileCount: Math.round(totals.fileCount / count),
      errorCount: Math.round(totals.errorCount / count),
      warningCount: Math.round(totals.warningCount / count)
    };
  }

  private calculateTrends(): PerformanceTrend[] {
    if (this.metrics.length < 10) return [];

    const recentMetrics = this.metrics.slice(-10);
    const olderMetrics = this.metrics.slice(-20, -10);

    if (olderMetrics.length === 0) return [];

    const trends: PerformanceTrend[] = [];
    const metricsToAnalyze: (keyof TypeCheckMetrics)[] = ['duration', 'errorCount', 'warningCount'];

    for (const metric of metricsToAnalyze) {
      const recentAvg = recentMetrics.reduce((sum, m) => sum + (m[metric] as number), 0) / recentMetrics.length;
      const olderAvg = olderMetrics.reduce((sum, m) => sum + (m[metric] as number), 0) / olderMetrics.length;

      const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      let trend: PerformanceTrend['trend'] = 'stable';

      if (Math.abs(changePercent) > 5) {
        trend = changePercent < 0 ? 'improving' : 'degrading';
      }

      trends.push({
        metric,
        trend,
        changePercent,
        samples: recentMetrics.length
      });
    }

    return trends;
  }

  private calculateIncrementalSpeedup(): number | null {
    const incrementalBuilds = this.metrics.filter(m => m.isIncremental);
    const fullBuilds = this.metrics.filter(m => !m.isIncremental);

    if (incrementalBuilds.length === 0 || fullBuilds.length === 0) {
      return null;
    }

    const avgIncremental = incrementalBuilds.reduce((sum, m) => sum + m.duration, 0) / incrementalBuilds.length;
    const avgFull = fullBuilds.reduce((sum, m) => sum + m.duration, 0) / fullBuilds.length;

    return avgFull > 0 ? (avgFull - avgIncremental) / avgFull : 0;
  }

  private calculateErrorRate(): number {
    if (this.metrics.length === 0) return 0;

    const totalChecks = this.metrics.length;
    const checksWithErrors = this.metrics.filter(m => m.errorCount > 0).length;

    return checksWithErrors / totalChecks;
  }

  private getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external
      };
    }

    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    };
  }

  private getSystemInfo() {
    return {
      platform: typeof process !== 'undefined' ? process.platform : 'browser',
      nodeVersion: typeof process !== 'undefined' ? process.version : 'N/A',
      typescriptVersion: 'determined-at-runtime' // Will be populated by build scripts
    };
  }

  private createEmptyMetrics(): TypeCheckMetrics {
    return {
      duration: 0,
      fileCount: 0,
      errorCount: 0,
      warningCount: 0,
      timestamp: Date.now(),
      isIncremental: false
    };
  }

  private logPerformanceUpdate(metrics: TypeCheckMetrics): void {
    const speedClass = metrics.duration < 1000 ? '🚀' : 
                      metrics.duration < 3000 ? '⚡' : 
                      metrics.duration < 5000 ? '🐌' : '🚨';

    console.log(`${speedClass} TypeScript Check: ${metrics.duration}ms (${metrics.isIncremental ? 'incremental' : 'full'}) - ${metrics.errorCount} errors, ${metrics.warningCount} warnings`);
  }
}

// Export singleton instance
export const tsPerformanceMonitor = new TypeScriptPerformanceMonitor(); 