// Simple in-memory cache with LRU eviction for EPCalculator

class LRUCache {
  constructor(maxSize = 100, maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
    this.cache = new Map();
  }

  generateKey(params) {
    // Create a stable key from parameters with deep sorting
    const sortedParams = this.deepSort(params);
    return JSON.stringify(sortedParams);
  }

  deepSort(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSort(item));
    }

    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.deepSort(obj[key]);
    });
    return sorted;
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.data;
  }

  set(key, data) {
    // Remove if already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Add new item
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    // Check if expired
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Get cache statistics
  stats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      maxSize: this.maxSize,
      maxAge: this.maxAge
    };
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances for different types of data
export const simulationCache = new LRUCache(50, 10 * 60 * 1000); // 10 minutes for simulations
export const plotCache = new LRUCache(30, 5 * 60 * 1000); // 5 minutes for plots

// Cache-aware API wrappers
export function getCachedSimulation(params) {
  const key = simulationCache.generateKey(params);
  return simulationCache.get(key);
}

export function setCachedSimulation(params, result) {
  const key = simulationCache.generateKey(params);
  simulationCache.set(key, result);
}

export function getCachedPlot(params) {
  const key = plotCache.generateKey(params);
  return plotCache.get(key);
}

export function setCachedPlot(params, result) {
  const key = plotCache.generateKey(params);
  plotCache.set(key, result);
}

// Debounce utility for user input
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for high-frequency events
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  start(name) {
    this.marks.set(name, performance.now());
  }

  end(name) {
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      console.warn(`Performance mark '${name}' not found`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.measures.push({
      name,
      duration,
      timestamp: Date.now()
    });

    this.marks.delete(name);
    return duration;
  }

  getStats() {
    const grouped = this.measures.reduce((acc, measure) => {
      if (!acc[measure.name]) {
        acc[measure.name] = [];
      }
      acc[measure.name].push(measure.duration);
      return acc;
    }, {});

    const stats = {};
    for (const [name, durations] of Object.entries(grouped)) {
      const sorted = durations.sort((a, b) => a - b);
      stats[name] = {
        count: durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)]
      };
    }

    return stats;
  }

  clear() {
    this.marks.clear();
    this.measures = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Cleanup function to run periodically
export function runCacheCleanup() {
  simulationCache.cleanup();
  plotCache.cleanup();

  console.log('🧹 Cache cleanup completed:', {
    simulation: simulationCache.stats(),
    plot: plotCache.stats()
  });
}

// Auto-cleanup every 5 minutes
setInterval(runCacheCleanup, 5 * 60 * 1000);