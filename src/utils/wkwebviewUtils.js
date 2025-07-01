/**
 * WKWebView兼容性工具函数
 * 用于检测和修复WKWebView环境下的页面白屏和渲染问题
 */

/**
 * 检测是否为WKWebView环境
 * @returns {boolean} 是否为WKWebView环境
 */
export const isWKWebView = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
  const isWK = window.webkit && window.webkit.messageHandlers;
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  
  // 更精确的WKWebView检测，包括macOS
  // 在macOS环境下，即使不是严格的WKWebView，也可能需要兼容性修复
  return (isIOS || isMacOS) && (isWK || (isSafari && window.webkit) || isMacOS);
};

/**
 * 检测是否为macOS环境
 * @returns {boolean} 是否为macOS环境
 */
export const isMacOS = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
};

/**
 * 检测macOS版本
 * @returns {number|null} macOS版本号，如果不是macOS则返回null
 */
export const getMacOSVersion = () => {
  if (typeof window === 'undefined' || !isMacOS()) return null;
  
  const userAgent = window.navigator.userAgent;
  const match = userAgent.match(/Mac OS X (\d+)_(\d+)/);
  
  if (match) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  
  // 尝试新的版本格式
  const newMatch = userAgent.match(/Mac OS X (\d+\.\d+)/);
  if (newMatch) {
    return parseFloat(newMatch[1]);
  }
  
  return null;
};

/**
 * 检测iOS版本
 * @returns {number|null} iOS版本号，如果不是iOS则返回null
 */
export const getIOSVersion = () => {
  if (typeof window === 'undefined') return null;
  
  const userAgent = window.navigator.userAgent;
  const match = userAgent.match(/OS (\d+)_(\d+)/);
  
  if (match) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  
  return null;
};

/**
 * 强制重绘元素以解决WKWebView白屏问题
 * @param {HTMLElement|string} element - 要重绘的元素或选择器
 */
export const forceRepaint = (element) => {
  let targetElement;
  
  if (typeof element === 'string') {
    targetElement = document.querySelector(element);
  } else {
    targetElement = element;
  }
  
  if (!targetElement) return;
  
  // 方法1: 强制重排
  const originalTransform = targetElement.style.transform;
  targetElement.style.transform = 'translateZ(0.1px)';
  targetElement.offsetHeight; // 触发重排
  
  // 恢复原始transform
  setTimeout(() => {
    targetElement.style.transform = originalTransform || 'translateZ(0)';
  }, 10);
  
  // 针对设置页面的特殊重绘处理
  if (targetElement.hasAttribute('data-component') && targetElement.getAttribute('data-component') === 'settings') {
    // 强制重新计算所有子元素
    const children = targetElement.querySelectorAll('*');
    children.forEach(child => {
      child.offsetHeight;
    });
    
    // 延迟再次重绘确保渲染完成
    setTimeout(() => {
      targetElement.style.opacity = '0.99';
      targetElement.offsetHeight;
      targetElement.style.opacity = '1';
    }, 50);
  }
  
  // 方法2: 临时修改display属性
  if (targetElement.style.opacity !== '0') {
    const originalDisplay = targetElement.style.display;
    targetElement.style.display = 'none';
    targetElement.offsetHeight; // 触发重排
    targetElement.style.display = originalDisplay || 'flex';
  }
};

/**
 * 应用macOS特定的修复
 * @param {HTMLElement} element - 要应用修复的元素
 */
export const applyMacOSFixes = (element) => {
  if (!isMacOS() || !element) return;
  
  // macOS特定的渲染修复
  element.style.webkitTransform = 'translateZ(0)';
  element.style.transform = 'translateZ(0)';
  element.style.webkitBackfaceVisibility = 'hidden';
  element.style.backfaceVisibility = 'hidden';
  
  // macOS Safari特定优化
  element.style.webkitFontSmoothing = 'antialiased';
  element.style.mozOsxFontSmoothing = 'grayscale';
  
  // 防止白屏的关键修复
  element.style.contain = 'layout style';
  element.style.willChange = 'auto';
  
  // 确保正确的显示属性
  if (element.style.display === '' || element.style.display === 'none') {
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
  }
  
  // 设置最小高度以防止白屏
  if (!element.style.minHeight) {
    element.style.minHeight = '100vh';
  }
  
  // 修复overflow问题
  if (element.style.overflow === 'hidden') {
    element.style.overflow = 'visible';
  }
  
  // macOS版本特定修复
  const macVersion = getMacOSVersion();
  if (macVersion && macVersion >= 10.15) {
    // macOS Catalina及以上版本的特殊处理
    element.style.isolation = 'isolate';
    element.style.webkitOverflowScrolling = 'touch';
  }
  
  // 修复可能的层叠上下文问题
  if (element.style.position === 'fixed' || element.style.position === 'absolute') {
    element.style.zIndex = element.style.zIndex || '1';
  }
  
  // 针对设置页面的特殊修复
  if (element.hasAttribute('data-component') && element.getAttribute('data-component') === 'settings') {
    element.style.isolation = 'isolate';
    element.style.contain = 'layout style';
    element.style.position = 'relative';
    element.style.zIndex = '1';
    
    // 强制重新计算布局
    element.offsetHeight;
  }
};

/**
 * 应用WKWebView兼容性修复
 * @param {HTMLElement} element - 要应用修复的元素
 */
export const applyWKWebViewFixes = (element) => {
  if (!element) return;
  
  // 检查是否需要应用修复
  const needsFix = isWKWebView() || isMacOS();
  if (!needsFix) return;
  
  // 应用硬件加速
  element.style.webkitTransform = 'translateZ(0)';
  element.style.transform = 'translateZ(0)';
  element.style.webkitBackfaceVisibility = 'hidden';
  element.style.backfaceVisibility = 'hidden';
  element.style.webkitPerspective = '1000';
  element.style.perspective = '1000';
  
  // 优化渲染性能
  element.style.willChange = 'transform, opacity';
  element.style.contain = 'layout style paint';
  
  // iOS特定修复
  const iosVersion = getIOSVersion();
  if (iosVersion && iosVersion >= 13) {
    // iOS 13+的特殊处理
    element.style.isolation = 'isolate';
  }
  
  // macOS特定修复
  if (isMacOS()) {
    applyMacOSFixes(element);
  }
};

/**
 * 初始化macOS特定的修复
 * @param {Object} options - 配置选项
 */
export const initMacOSFixes = (options = {}) => {
  if (!isMacOS()) return;
  
  const {
    autoRepaint = true,
    repaintDelay = 150,
    settingsPageFix = true
  } = options;
  
  console.log('Initializing macOS compatibility fixes');
  
  // macOS特定的Settings页面修复
  const applySettingsPageFixes = () => {
    if (!settingsPageFix) return;
    
    // 查找Settings容器
    const settingsContainer = document.querySelector('[data-component="settings"]') || 
                             document.querySelector('.settings-container') ||
                             document.querySelector('div[class*="Settings"]');
    
    if (settingsContainer) {
      // 应用macOS特定修复
      applyMacOSFixes(settingsContainer);
      
      // 修复可能的渲染问题
      settingsContainer.style.minHeight = '100vh';
      settingsContainer.style.overflow = 'visible';
      
      // 强制重绘
      if (autoRepaint) {
        setTimeout(() => forceRepaint(settingsContainer), repaintDelay);
      }
      
      // 修复子元素
      const childElements = settingsContainer.querySelectorAll('*');
      childElements.forEach(child => {
        if (child.offsetHeight === 0 || child.offsetWidth === 0) {
          applyMacOSFixes(child);
          if (autoRepaint) {
            setTimeout(() => forceRepaint(child), repaintDelay + 50);
          }
        }
      });
    }
  };
  
  // 监听路由变化以应用Settings页面修复
  const handleRouteChange = () => {
    setTimeout(applySettingsPageFixes, 100);
  };
  
  // 监听DOM变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查是否是Settings相关元素
            if (node.matches && (node.matches('[data-component="settings"]') || 
                                node.matches('.settings-container') ||
                                node.matches('div[class*="Settings"]'))) {
              setTimeout(applySettingsPageFixes, 50);
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 立即应用修复
  applySettingsPageFixes();
  
  // 返回清理函数
  return () => {
    observer.disconnect();
  };
};

/**
 * 初始化WKWebView兼容性修复
 * @param {Object} options - 配置选项
 * @param {boolean} options.autoRepaint - 是否自动重绘
 * @param {number} options.repaintDelay - 重绘延迟时间（毫秒）
 * @param {string[]} options.selectors - 需要修复的元素选择器数组
 */
export const initWKWebViewFixes = (options = {}) => {
  const needsFix = isWKWebView() || isMacOS();
  if (!needsFix) return;
  
  const {
    autoRepaint = true,
    repaintDelay = 100,
    selectors = ['[data-sidebar="true"]', '#root', 'body', '[data-app-container="true"]']
  } = options;
  
  console.log('Initializing WKWebView/macOS compatibility fixes');
  
  // 应用全局修复
  const applyGlobalFixes = () => {
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        applyWKWebViewFixes(element);
        if (autoRepaint) {
          setTimeout(() => forceRepaint(element), repaintDelay);
        }
      });
    });
  };
  
  // 立即应用修复
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGlobalFixes);
  } else {
    applyGlobalFixes();
  }
  
  // 初始化macOS特定修复
  let macOSCleanup;
  if (isMacOS()) {
    macOSCleanup = initMacOSFixes(options);
  }
  
  // 监听页面可见性变化
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      setTimeout(applyGlobalFixes, 50);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 监听窗口大小变化
  const handleResize = () => {
    setTimeout(applyGlobalFixes, 100);
  };
  
  window.addEventListener('resize', handleResize);
  
  // 返回清理函数
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('resize', handleResize);
    if (macOSCleanup) {
      macOSCleanup();
    }
  };
};

/**
 * 获取macOS专用CSS样式
 * @returns {string} CSS样式字符串
 */
export const getMacOSCSS = () => {
  if (!isMacOS()) return '';
  
  return `
    /* macOS兼容性修复 */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    contain: layout style;
    will-change: auto;
    overflow: visible;
    min-height: 100vh;
  `;
};

/**
 * 获取WKWebView专用CSS样式
 * @returns {string} CSS样式字符串
 */
export const getWKWebViewCSS = () => {
  const needsFix = isWKWebView() || isMacOS();
  if (!needsFix) return '';
  
  let css = `
    /* WKWebView兼容性修复 */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-perspective: 1000;
    perspective: 1000;
    -webkit-overflow-scrolling: touch;
    will-change: transform, opacity;
    contain: layout style paint;
    isolation: isolate;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;
  
  // 添加macOS特定样式
  if (isMacOS()) {
    css += getMacOSCSS();
  }
  
  return css;
};

/**
 * 检测并修复WKWebView中的backdrop-filter问题
 * @param {HTMLElement} element - 要检测的元素
 */
export const fixBackdropFilter = (element) => {
  if (!isWKWebView() || !element) return;
  
  // 在WKWebView中禁用backdrop-filter，使用替代方案
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.backdropFilter !== 'none' || computedStyle.webkitBackdropFilter !== 'none') {
    element.style.backdropFilter = 'none';
    element.style.webkitBackdropFilter = 'none';
    
    // 添加替代的半透明背景
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      // 增加背景色的不透明度作为替代
      element.style.backgroundColor = bgColor.replace(/rgba?\(([^)]+)\)/, (match, values) => {
        const parts = values.split(',').map(v => v.trim());
        if (parts.length >= 3) {
          const alpha = parts.length === 4 ? Math.min(parseFloat(parts[3]) + 0.1, 0.95) : 0.95;
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
        }
        return match;
      });
    }
  }
};

export default {
  isWKWebView,
  isMacOS,
  getIOSVersion,
  getMacOSVersion,
  forceRepaint,
  applyWKWebViewFixes,
  applyMacOSFixes,
  initWKWebViewFixes,
  initMacOSFixes,
  getWKWebViewCSS,
  getMacOSCSS,
  fixBackdropFilter
};