import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 自定义钩子 - 性能追踪器
 * 用于监控重要UI操作的性能，帮助检测潜在的性能瓶颈
 */
const usePerformanceTracker = (isDevelopment = process.env.NODE_ENV === 'development') => {
  const [metrics, setMetrics] = useState({});
  const operationsCounter = useRef({});
  const markTimers = useRef({});
  
  // 只在开发环境启用性能监控
  const enabled = isDevelopment && typeof window !== 'undefined' && window.performance;
  
  // 开始操作计时
  const trackStart = useCallback((operation) => {
    if (!enabled) return null;
    
    const markName = `${operation}-${Date.now()}`;
    window.performance.mark(markName);
    markTimers.current[operation] = markName;
    
    // 更新操作计数
    operationsCounter.current[operation] = (operationsCounter.current[operation] || 0) + 1;
    
    return markName;
  }, [enabled]);
  
  // 结束操作计时并记录结果
  const trackEnd = useCallback((operation) => {
    if (!enabled || !markTimers.current[operation]) return;
    
    const startMark = markTimers.current[operation];
    const endMark = `${operation}-end-${Date.now()}`;
    const measureName = `${operation}-measure-${Date.now()}`;
    
    try {
      // 创建结束标记
      window.performance.mark(endMark);
      
      // 测量开始到结束的时间
      window.performance.measure(measureName, startMark, endMark);
      
      // 获取测量结果
      const entries = window.performance.getEntriesByName(measureName);
      if (entries.length > 0) {
        const duration = entries[0].duration;
        
        // 更新指标状态
        setMetrics(prev => ({
          ...prev,
          [operation]: {
            lastDuration: duration,
            avgDuration: prev[operation] 
              ? (prev[operation].avgDuration * (operationsCounter.current[operation] - 1) + duration) / operationsCounter.current[operation]
              : duration,
            count: operationsCounter.current[operation]
          }
        }));
        
        // 如果操作超过100ms，记录警告
        if (duration > 100) {
          console.warn(`Performance warning: ${operation} took ${duration.toFixed(2)}ms`);
        }
      }
      
      // 清理性能条目
      window.performance.clearMarks(startMark);
      window.performance.clearMarks(endMark);
      window.performance.clearMeasures(measureName);
    } catch (error) {
      console.error(`Error tracking performance for ${operation}:`, error);
    }
    
    // 清理计时器引用
    delete markTimers.current[operation];
  }, [enabled]);
  
  // 在组件卸载时清理所有性能条目
  useEffect(() => {
    return () => {
      if (enabled) {
        try {
          window.performance.clearMarks();
          window.performance.clearMeasures();
        } catch (error) {
          console.error('Error clearing performance entries:', error);
        }
      }
    };
  }, [enabled]);
  
  // 追踪函数执行性能的包装器
  const trackOperation = useCallback((operation, fn, ...args) => {
    if (!enabled) return fn(...args);
    
    trackStart(operation);
    try {
      const result = fn(...args);
      
      // 处理Promise结果
      if (result instanceof Promise) {
        return result.finally(() => trackEnd(operation));
      }
      
      trackEnd(operation);
      return result;
    } catch (error) {
      trackEnd(operation);
      throw error;
    }
  }, [enabled, trackStart, trackEnd]);
  
  return {
    trackStart,
    trackEnd,
    trackOperation,
    metrics,
    enabled
  };
};

export default usePerformanceTracker; 