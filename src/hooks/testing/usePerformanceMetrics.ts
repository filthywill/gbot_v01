import React, { useRef, useEffect, useCallback } from 'react';

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  slowRenders: Array<{
    timestamp: number;
    duration: number;
    props?: any;
  }>;
  stateUpdates: Array<{
    timestamp: number;
    updateType: string;
    duration: number;
  }>;
}

export interface UsePerformanceMetricsOptions {
  /** Component name for debugging */
  componentName?: string;
  /** Log performance warnings when render time exceeds threshold (ms) */
  slowRenderThreshold?: number;
  /** Maximum number of slow renders to track */
  maxSlowRenders?: number;
  /** Whether to track props changes */
  trackProps?: boolean;
  /** Whether to enable console logging */
  enableLogging?: boolean;
}

/**
 * Hook for measuring component performance and state update timing
 */
export const usePerformanceMetrics = (
  options: UsePerformanceMetricsOptions = {}
) => {
  const {
    componentName = 'Unknown Component',
    slowRenderThreshold = 16, // 16ms = 60fps
    maxSlowRenders = 10,
    trackProps = false,
    enableLogging = process.env.NODE_ENV === 'development'
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    slowRenders: [],
    stateUpdates: []
  });

  const renderStartTimeRef = useRef<number>(0);
  const previousPropsRef = useRef<any>(null);

  // Start performance measurement
  const startRenderMeasurement = useCallback(() => {
    renderStartTimeRef.current = performance.now();
  }, []);

  // End performance measurement
  const endRenderMeasurement = useCallback((props?: any) => {
    const renderTime = performance.now() - renderStartTimeRef.current;
    const metrics = metricsRef.current;

    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    // Track slow renders
    if (renderTime > slowRenderThreshold) {
      if (metrics.slowRenders.length >= maxSlowRenders) {
        metrics.slowRenders.shift(); // Remove oldest
      }
      
      metrics.slowRenders.push({
        timestamp: Date.now(),
        duration: renderTime,
        props: trackProps ? props : undefined
      });

      if (enableLogging) {
        console.warn(
          `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
          trackProps && props ? { props } : ''
        );
      }
    }

    // Log performance metrics periodically
    if (enableLogging && metrics.renderCount % 10 === 0) {
      console.log(`📊 ${componentName} Performance:`, {
        renders: metrics.renderCount,
        avgTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
        slowRenders: metrics.slowRenders.length
      });
    }
  }, [componentName, slowRenderThreshold, maxSlowRenders, trackProps, enableLogging]);

  // Measure state update performance
  const measureStateUpdate = useCallback(<T>(
    operation: () => T,
    updateType: string
  ): T => {
    const startTime = performance.now();
    const result = operation();
    const duration = performance.now() - startTime;

    const metrics = metricsRef.current;
    metrics.stateUpdates.push({
      timestamp: Date.now(),
      updateType,
      duration
    });

    // Keep only recent state updates (last 50)
    if (metrics.stateUpdates.length > 50) {
      metrics.stateUpdates.splice(0, metrics.stateUpdates.length - 50);
    }

    if (enableLogging && duration > 5) {
      console.log(`⚡ State update "${updateType}" took ${duration.toFixed(2)}ms`);
    }

    return result;
  }, [enableLogging]);

  // Track props changes
  const trackPropsChange = useCallback((props: any) => {
    if (!trackProps) return;

    const previousProps = previousPropsRef.current;
    if (previousProps) {
      const changedProps = Object.keys(props).filter(
        key => props[key] !== previousProps[key]
      );

      if (changedProps.length > 0 && enableLogging) {
        console.log(`🔄 ${componentName} props changed:`, changedProps);
      }
    }
    
    previousPropsRef.current = props;
  }, [componentName, trackProps, enableLogging]);

  // Auto-start render measurement on every render
  useEffect(() => {
    startRenderMeasurement();
  });

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      slowRenders: [],
      stateUpdates: []
    };
  }, []);

  // Export metrics as CSV
  const exportMetricsCSV = useCallback(() => {
    const metrics = metricsRef.current;
    const csv = [
      'Component,Render Count,Average Render Time (ms),Total Render Time (ms),Slow Renders',
      `${componentName},${metrics.renderCount},${metrics.averageRenderTime.toFixed(2)},${metrics.totalRenderTime.toFixed(2)},${metrics.slowRenders.length}`
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName.replace(/\s+/g, '_')}_performance_metrics.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [componentName]);

  return {
    // Measurement functions
    startRenderMeasurement,
    endRenderMeasurement,
    measureStateUpdate,
    trackPropsChange,
    
    // Metrics access
    getMetrics,
    resetMetrics,
    exportMetricsCSV,
    
    // Quick access to key metrics
    renderCount: metricsRef.current.renderCount,
    averageRenderTime: metricsRef.current.averageRenderTime,
    slowRenderCount: metricsRef.current.slowRenders.length
  };
};

/**
 * Hook for measuring specific operations
 */
export const useOperationTimer = () => {
  const timerRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    timerRef.current = performance.now();
  }, []);

  const endTimer = useCallback((operationName?: string) => {
    const duration = performance.now() - timerRef.current;
    
    if (operationName && process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }, []);

  const measure = useCallback(<T>(
    operation: () => T,
    operationName?: string
  ): { result: T; duration: number } => {
    startTimer();
    const result = operation();
    const duration = endTimer(operationName);
    
    return { result, duration };
  }, [startTimer, endTimer]);

  return {
    startTimer,
    endTimer,
    measure
  };
}; 