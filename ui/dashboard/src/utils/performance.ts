// Performance Monitoring Utilities
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  entries: any[];
  navigationType?: string;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeVitalsTracking();
    this.initializeCustomMetrics();
  }

  private initializeVitalsTracking() {
    // Track Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));
  }

  private initializeCustomMetrics() {
    // Track component render times
    this.observePerformanceEntries(['measure'], (entries) => {
      entries.forEach((entry) => {
        if (entry.name.startsWith('⚛️')) {
          this.recordCustomMetric('react-render', entry.duration, {
            component: entry.name,
            startTime: entry.startTime,
          });
        }
      });
    });

    // Track navigation timing
    this.observePerformanceEntries(['navigation'], (entries) => {
      entries.forEach((entry: any) => {
        this.recordCustomMetric('navigation-timing', entry.loadEventEnd - entry.navigationStart, {
          domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
          domComplete: entry.domComplete - entry.navigationStart,
        });
      });
    });

    // Track resource loading
    this.observePerformanceEntries(['resource'], (entries) => {
      entries.forEach((entry: any) => {
        if (entry.name.includes('/api/')) {
          this.recordCustomMetric('api-request', entry.duration, {
            url: entry.name,
            size: entry.transferSize,
            cached: entry.transferSize === 0,
          });
        }
      });
    });
  }

  private observePerformanceEntries(entryTypes: string[], callback: (entries: PerformanceEntry[]) => void) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      try {
        observer.observe({ entryTypes });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Performance observer not supported for', entryTypes);
      }
    }
  }

  private handleMetric(metric: PerformanceMetric) {
    this.metrics.set(metric.name, metric);
    this.reportMetric(metric);
  }

  private recordCustomMetric(name: string, value: number, metadata: any = {}) {
    const metric: PerformanceMetric = {
      name,
      value,
      id: `${name}-${Date.now()}`,
      delta: value,
      entries: [],
      ...metadata,
    };

    this.metrics.set(name, metric);
    this.reportMetric(metric);
  }

  private reportMetric(metric: PerformanceMetric) {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}:`, metric.value, metric);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }

    // Check for performance thresholds
    this.checkThresholds(metric);
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Example implementations for different analytics services
    
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_id: metric.id,
      });
    }

    // Custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(() => {}); // Silent fail for analytics
  }

  private checkThresholds(metric: PerformanceMetric) {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (!threshold) return;

    let status = 'good';
    if (metric.value > threshold.poor) {
      status = 'poor';
    } else if (metric.value > threshold.good) {
      status = 'needs-improvement';
    }

    if (status !== 'good') {
      console.warn(`[Performance Warning] ${metric.name} is ${status}:`, metric.value);
      
      // In production, you might want to alert or log this
      if (process.env.NODE_ENV === 'production' && status === 'poor') {
        this.reportPerformanceIssue(metric, status);
      }
    }
  }

  private reportPerformanceIssue(metric: PerformanceMetric, status: string) {
    // Report to error tracking service
    console.error(`Performance issue detected: ${metric.name} (${status})`, metric);
    
    // Could integrate with Sentry, LogRocket, etc.
    // Sentry.captureMessage(`Performance issue: ${metric.name}`, 'warning', {
    //   extra: { metric, status }
    // });
  }

  // Public methods for manual tracking
  public startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordCustomMetric(name, duration);
    };
  }

  public trackUserInteraction(action: string, target?: string) {
    this.recordCustomMetric('user-interaction', performance.now(), {
      action,
      target,
      timestamp: Date.now(),
    });
  }

  public trackComponentRender(componentName: string, renderTime: number) {
    this.recordCustomMetric('component-render', renderTime, {
      component: componentName,
    });
  }

  public getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const startTiming = performanceMonitor.startTiming(`component-${componentName}`);
  
  return {
    trackRender: startTiming,
    trackInteraction: (action: string, target?: string) => {
      performanceMonitor.trackUserInteraction(action, target);
    },
  };
}