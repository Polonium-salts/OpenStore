/**
 * WebKit兼容性工具函数
 * 用于检测和修复WebKit环境下的页面白屏和渲染问题
 * 支持平台：macOS (WKWebView)、iOS (WKWebView)、Linux (WebKitGTK)
 * 基于Tauri官方文档：https://v2.tauri.org.cn/reference/webview-versions/#webkit-macos-ios--linux
 */

/**
 * 检测是否为WebKit环境（包括WKWebView和WebKitGTK）
 * @returns {boolean} 是否为WebKit环境
 */
export const isWebKit = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
  const isLinux = /Linux/.test(userAgent);
  const isWK = window.webkit && window.webkit.messageHandlers;
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isWebKitGTK = isLinux && /WebKit/.test(userAgent);
  
  // 检测所有WebKit环境：WKWebView (iOS/macOS) 和 WebKitGTK (Linux)
  return (isIOS || isMacOS) && (isWK || (isSafari && window.webkit)) || isWebKitGTK;
};

/**
 * 检测是否为WKWebView环境（保持向后兼容）
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
  return (isIOS || isMacOS) && (isWK || (isSafari && window.webkit));
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
 * 检测是否为Linux环境
 * @returns {boolean} 是否为Linux环境
 */
export const isLinux = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /Linux/.test(userAgent) && !/Android/.test(userAgent);
};

/**
 * 检测是否为WebKitGTK环境
 * @returns {boolean} 是否为WebKitGTK环境
 */
export const isWebKitGTK = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return isLinux() && /WebKit/.test(userAgent) && !/Chrome/.test(userAgent);
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
 * 检测WebKitGTK版本
 * @returns {string|null} WebKitGTK版本号，如果不是WebKitGTK则返回null
 */
export const getWebKitGTKVersion = () => {
  if (typeof window === 'undefined' || !isWebKitGTK()) return null;
  
  const userAgent = window.navigator.userAgent;
  // 尝试匹配WebKit版本号格式：WebKit/xxx.x.x
  const match = userAgent.match(/WebKit\/(\d+\.\d+(?:\.\d+)?)/);
  
  if (match) {
    return match[1];
  }
  
  return null;
};

/**
 * 检测Linux发行版信息
 * @returns {Object|null} 包含发行版名称和版本的对象，如果不是Linux则返回null
 */
export const getLinuxDistribution = () => {
  if (typeof window === 'undefined' || !isLinux()) return null;
  
  const userAgent = window.navigator.userAgent;
  
  // 检测常见的Linux发行版
  if (/Ubuntu/.test(userAgent)) {
    const match = userAgent.match(/Ubuntu\/(\d+\.\d+(?:\.\d+)?)/);
    return { name: 'Ubuntu', version: match ? match[1] : null };
  }
  
  if (/Debian/.test(userAgent)) {
    return { name: 'Debian', version: null };
  }
  
  if (/Fedora/.test(userAgent)) {
    const match = userAgent.match(/Fedora\/(\d+)/);
    return { name: 'Fedora', version: match ? match[1] : null };
  }
  
  if (/CentOS/.test(userAgent)) {
    return { name: 'CentOS', version: null };
  }
  
  if (/RHEL/.test(userAgent)) {
    return { name: 'RHEL', version: null };
  }
  
  if (/SUSE/.test(userAgent)) {
    return { name: 'SUSE', version: null };
  }
  
  if (/Arch/.test(userAgent)) {
    return { name: 'Arch', version: null };
  }
  
  return { name: 'Linux', version: null };
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
  targetElement.style.transform = 'translateZ(0)';
  targetElement.offsetHeight; // 触发重排
  targetElement.style.transform = originalTransform;
  
  // 方法2: 临时修改display属性
  const originalDisplay = targetElement.style.display;
  targetElement.style.display = 'none';
  targetElement.offsetHeight; // 触发重排
  targetElement.style.display = originalDisplay;
};

/**
 * 应用Linux WebKitGTK特定的修复
 * @param {HTMLElement} element - 要应用修复的元素
 */
export const applyLinuxWebKitGTKFixes = (element) => {
  if (!isWebKitGTK() || !element) return;
  
  // Linux WebKitGTK特定的渲染修复
  element.style.webkitTransform = 'translateZ(0)';
  element.style.transform = 'translateZ(0)';
  element.style.webkitBackfaceVisibility = 'hidden';
  element.style.backfaceVisibility = 'hidden';
  
  // Linux特定的字体渲染优化
  element.style.webkitFontSmoothing = 'antialiased';
  element.style.mozOsxFontSmoothing = 'grayscale';
  element.style.textRendering = 'optimizeLegibility';
  
  // 防止白屏的关键修复
  element.style.contain = 'layout style';
  element.style.willChange = 'auto';
  
  // WebKitGTK特定优化
  const webkitVersion = getWebKitGTKVersion();
  if (webkitVersion) {
    const versionNumber = parseFloat(webkitVersion);
    if (versionNumber >= 2.30) {
      // WebKitGTK 2.30+的特殊处理
      element.style.isolation = 'isolate';
      element.style.overflowAnchor = 'none';
    }
  }
  
  // Linux发行版特定修复
  const distro = getLinuxDistribution();
  if (distro) {
    switch (distro.name) {
      case 'Ubuntu':
      case 'Debian':
        // Ubuntu/Debian特定修复
        element.style.webkitTextSizeAdjust = '100%';
        break;
      case 'Fedora':
      case 'RHEL':
      case 'CentOS':
        // Red Hat系列特定修复
        element.style.webkitTapHighlightColor = 'transparent';
        break;
      case 'Arch':
        // Arch Linux特定修复
        element.style.webkitUserSelect = 'auto';
        break;
    }
  }
  
  // 修复可能的层叠上下文问题
  if (element.style.position === 'fixed' || element.style.position === 'absolute') {
    element.style.zIndex = element.style.zIndex || '1';
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
};

/**
 * 应用WebKit兼容性修复（支持所有WebKit平台）
 * @param {HTMLElement} element - 要应用修复的元素
 */
export const applyWebKitFixes = (element) => {
  if (!element) return;
  
  // 检查是否需要应用修复
  const needsFix = isWebKit();
  if (!needsFix) return;
  
  // 应用通用WebKit硬件加速
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
  
  // 平台特定修复
  if (isMacOS()) {
    applyMacOSFixes(element);
  } else if (isWebKitGTK()) {
    applyLinuxWebKitGTKFixes(element);
  }
};

/**
 * 应用WKWebView兼容性修复（保持向后兼容）
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
  
  console.log('Initializing macOS compatibility fixes with enhanced white screen prevention');
  
  // 增强的macOS白屏修复
  const applyMacOSWhiteScreenFix = () => {
    // 强制设置根元素样式
    const root = document.getElementById('root');
    if (root) {
      // 防止白屏的关键样式
      root.style.minHeight = '100vh';
      root.style.visibility = 'visible !important';
      root.style.opacity = '1 !important';
      root.style.display = 'block';
      root.style.position = 'relative';
      root.style.zIndex = '1';
      root.style.isolation = 'isolate';
      
      // 应用macOS特定修复
      applyMacOSFixes(root);
      
      // 多次重绘确保渲染
      if (autoRepaint) {
        setTimeout(() => forceRepaint(root), repaintDelay);
        setTimeout(() => forceRepaint(root), repaintDelay * 2);
        setTimeout(() => forceRepaint(root), repaintDelay * 4);
      }
    }
    
    // 修复body元素
    document.body.style.visibility = 'visible !important';
    document.body.style.opacity = '1 !important';
    document.body.style.minHeight = '100vh';
    document.body.style.overflow = 'visible';
    applyMacOSFixes(document.body);
    
    // 修复html元素
    document.documentElement.style.visibility = 'visible !important';
    document.documentElement.style.opacity = '1 !important';
    document.documentElement.style.minHeight = '100vh';
    
    if (autoRepaint) {
      setTimeout(() => forceRepaint(document.body), repaintDelay);
      setTimeout(() => forceRepaint(document.documentElement), repaintDelay);
    }
    
    // 强制触发重排和重绘
    const forceReflow = () => {
      document.body.offsetHeight; // 触发重排
      if (root) root.offsetHeight;
    };
    
    setTimeout(forceReflow, 50);
    setTimeout(forceReflow, 150);
    setTimeout(forceReflow, 300);
  };
  
  // macOS特定的Settings页面修复
  const applySettingsPageFixes = () => {
    if (!settingsPageFix) return;
    
    // 查找Settings容器 - 增加更多选择器
    const settingsContainer = document.querySelector('[data-settings-container]') ||
                             document.querySelector('[data-component="settings"]') || 
                             document.querySelector('.settings-container') ||
                             document.querySelector('div[class*="Settings"]') ||
                             document.querySelector('div[class*="SettingsContainer"]');
    
    if (settingsContainer) {
      console.log('Applying enhanced Settings page fixes for macOS');
      
      // 应用macOS特定修复
      applyMacOSFixes(settingsContainer);
      
      // 增强的渲染修复
      settingsContainer.style.minHeight = '100vh';
      settingsContainer.style.overflow = 'visible';
      settingsContainer.style.visibility = 'visible !important';
      settingsContainer.style.opacity = '1 !important';
      settingsContainer.style.display = 'flex';
      settingsContainer.style.position = 'relative';
      settingsContainer.style.zIndex = '1';
      settingsContainer.style.isolation = 'isolate';
      settingsContainer.style.contain = 'layout style';
      
      // 强制重绘多次
      if (autoRepaint) {
        setTimeout(() => forceRepaint(settingsContainer), repaintDelay);
        setTimeout(() => forceRepaint(settingsContainer), repaintDelay * 2);
        setTimeout(() => forceRepaint(settingsContainer), repaintDelay * 4);
      }
      
      // 修复子元素
      const childElements = settingsContainer.querySelectorAll('*');
      childElements.forEach(child => {
        // 确保所有子元素都可见
        child.style.visibility = 'visible !important';
        child.style.opacity = '1 !important';
        
        if (child.offsetHeight === 0 || child.offsetWidth === 0) {
          applyMacOSFixes(child);
          if (autoRepaint) {
            setTimeout(() => forceRepaint(child), repaintDelay + 50);
          }
        }
      });
      
      // 额外的渲染修复和检查
      setTimeout(() => {
        if (settingsContainer.offsetHeight === 0) {
          console.warn('Settings container has zero height, applying emergency fixes');
          settingsContainer.style.height = 'auto';
          settingsContainer.style.minHeight = '100vh';
          settingsContainer.style.display = 'flex';
          settingsContainer.style.flexDirection = 'column';
          forceRepaint(settingsContainer);
          
          // 强制触发重排
          settingsContainer.offsetHeight;
          document.body.offsetHeight;
        }
      }, repaintDelay + 100);
      
      // 延迟检查，确保持续可见
      setTimeout(() => {
        const computedStyle = getComputedStyle(settingsContainer);
        if (computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
          console.warn('Settings container still hidden, applying final fixes');
          settingsContainer.style.visibility = 'visible !important';
          settingsContainer.style.opacity = '1 !important';
          forceRepaint(settingsContainer);
        }
      }, repaintDelay + 300);
    }
  };
  
  // 监听路由变化以应用Settings页面修复
  const handleRouteChange = () => {
    setTimeout(applySettingsPageFixes, 100);
  };
  
  // 监听DOM变化，当Settings页面加载时应用修复
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查是否是Settings相关的元素 - 增加更多选择器
            if (node.matches && (node.matches('[data-settings-container]') ||
                                node.matches('[data-component="settings"]') || 
                                node.matches('.settings-container') ||
                                node.matches('div[class*="Settings"]') ||
                                node.matches('div[class*="SettingsContainer"]'))) {
              console.log('Settings element detected, applying fixes');
              setTimeout(applySettingsPageFixes, 50);
              setTimeout(applySettingsPageFixes, 200);
            }
            // 检查子元素
            const settingsElements = node.querySelectorAll('[data-settings-container], [data-component="settings"], .settings-container, div[class*="Settings"], div[class*="SettingsContainer"]');
            if (settingsElements.length > 0) {
              console.log('Settings child elements detected, applying fixes');
              setTimeout(applySettingsPageFixes, 50);
              setTimeout(applySettingsPageFixes, 200);
            }
          }
        });
      }
      // 监听属性变化
      if (mutation.type === 'attributes' && mutation.target.matches && 
          mutation.target.matches('[data-settings-container], [data-component="settings"], .settings-container, div[class*="Settings"], div[class*="SettingsContainer"]')) {
        setTimeout(applySettingsPageFixes, 50);
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  // 立即应用白屏修复
  applyMacOSWhiteScreenFix();
  
  // 立即应用Settings页面修复
  applySettingsPageFixes();
  
  // 定期检查机制，确保Settings组件持续正常显示
  const intervalCheck = setInterval(() => {
    const settingsContainer = document.querySelector('[data-settings-container]') ||
                             document.querySelector('[data-component="settings"]') || 
                             document.querySelector('.settings-container') ||
                             document.querySelector('div[class*="Settings"]') ||
                             document.querySelector('div[class*="SettingsContainer"]');
    if (settingsContainer) {
      // 检查容器是否可见
      if (settingsContainer.offsetHeight === 0 || settingsContainer.offsetWidth === 0 || 
          getComputedStyle(settingsContainer).visibility === 'hidden' ||
          getComputedStyle(settingsContainer).opacity === '0') {
        console.log('Settings container visibility issue detected, applying emergency fixes');
        applySettingsPageFixes();
      }
    }
  }, 2000); // 每2秒检查一次
  
  // 返回清理函数
  return () => {
    observer.disconnect();
    clearInterval(intervalCheck);
  };
};

/**
 * 初始化Linux WebKitGTK特定的修复
 * @param {Object} options - 配置选项
 */
export const initLinuxWebKitGTKFixes = (options = {}) => {
  if (!isWebKitGTK()) return;
  
  const {
    autoRepaint = true,
    repaintDelay = 150
  } = options;
  
  console.log('Initializing Linux WebKitGTK compatibility fixes');
  
  // Linux WebKitGTK特定的修复
  const applyLinuxFixes = () => {
    // 修复可能的字体渲染问题
    document.body.style.textRendering = 'optimizeLegibility';
    document.body.style.webkitFontSmoothing = 'antialiased';
    
    // 修复滚动性能
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // 应用WebKitGTK特定修复到关键元素
    const criticalElements = document.querySelectorAll('body, #root, [data-app-container="true"]');
    criticalElements.forEach(element => {
      applyLinuxWebKitGTKFixes(element);
      if (autoRepaint) {
        setTimeout(() => forceRepaint(element), repaintDelay);
      }
    });
  };
  
  // 监听DOM变化以应用修复
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            applyLinuxWebKitGTKFixes(node);
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
  applyLinuxFixes();
  
  // 返回清理函数
  return () => {
    observer.disconnect();
  };
};

/**
 * 初始化WebKit兼容性修复（支持所有WebKit平台）
 * @param {Object} options - 配置选项
 * @param {boolean} options.autoRepaint - 是否自动重绘
 * @param {number} options.repaintDelay - 重绘延迟时间（毫秒）
 * @param {string[]} options.selectors - 需要修复的元素选择器数组
 */
export const initWebKitFixes = (options = {}) => {
  const needsFix = isWebKit();
  if (!needsFix) return;
  
  const {
    autoRepaint = true,
    repaintDelay = 100,
    selectors = ['[data-sidebar="true"]', '#root', 'body', '[data-app-container="true"]']
  } = options;
  
  console.log('Initializing WebKit compatibility fixes for all platforms');
  
  // 应用全局修复
  const applyGlobalFixes = () => {
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        applyWebKitFixes(element);
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
  
  // 初始化平台特定修复
  let platformCleanup;
  if (isMacOS()) {
    platformCleanup = initMacOSFixes(options);
  } else if (isWebKitGTK()) {
    platformCleanup = initLinuxWebKitGTKFixes(options);
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
    if (platformCleanup) {
      platformCleanup();
    }
  };
};

/**
 * 初始化WKWebView兼容性修复（保持向后兼容）
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
 * 获取Linux WebKitGTK专用CSS样式
 * @returns {string} CSS样式字符串
 */
export const getLinuxWebKitGTKCSS = () => {
  if (!isWebKitGTK()) return '';
  
  return `
    /* Linux WebKitGTK兼容性修复 */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    contain: layout style;
    will-change: auto;
    overflow: visible;
    min-height: 100vh;
    scroll-behavior: smooth;
    overscroll-behavior: none;
  `;
};

/**
 * 获取WebKit专用CSS样式（支持所有WebKit平台）
 * @returns {string} CSS样式字符串
 */
export const getWebKitCSS = () => {
  const needsFix = isWebKit();
  if (!needsFix) return '';
  
  let css = `
    /* WebKit兼容性修复（通用） */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-perspective: 1000;
    perspective: 1000;
    will-change: transform, opacity;
    contain: layout style paint;
    isolation: isolate;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;
  
  // 添加平台特定样式
  if (isMacOS()) {
    css += getMacOSCSS();
  } else if (isWebKitGTK()) {
    css += getLinuxWebKitGTKCSS();
  }
  
  return css;
};

/**
 * 获取WKWebView专用CSS样式（保持向后兼容）
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