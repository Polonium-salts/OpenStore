import { useEffect, useRef } from 'react';

/**
 * 使用事件捕获阶段拦截特定事件，提高性能
 * 在DOM事件传播的捕获阶段处理事件，可以减少不必要的重新渲染
 */
const useEventCapture = (selector, eventType, handler, options = {}) => {
  // 保存处理函数的引用
  const handlerRef = useRef(handler);
  
  // 当处理函数变化时更新引用
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  
  useEffect(() => {
    // 获取目标元素
    const targetElement = selector === 'window' 
      ? window 
      : selector === 'document' 
        ? document 
        : document.querySelector(selector);
    
    if (!targetElement) {
      console.warn(`Element with selector "${selector}" not found`);
      return;
    }
    
    // 创建事件处理函数
    const eventHandler = (event) => {
      // 对于某些需要阻止事件继续传播的情况
      if (options.stopPropagation) {
        event.stopPropagation();
      }
      
      // 对于某些需要阻止默认行为的情况
      if (options.preventDefault) {
        event.preventDefault();
      }
      
      // 调用实际的处理函数
      handlerRef.current(event);
    };
    
    // 添加事件监听器，使用捕获阶段
    targetElement.addEventListener(eventType, eventHandler, { 
      capture: true,  // 使用捕获阶段
      passive: options.passive === undefined ? true : options.passive, // 默认为被动模式，除非明确指定
      once: options.once || false
    });
    
    // 清理事件监听器
    return () => {
      targetElement.removeEventListener(eventType, eventHandler, {
        capture: true
      });
    };
  }, [selector, eventType, options]);
};

export default useEventCapture; 