import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import TranslationProvider from './components/TranslationProvider';
import './i18n';

// 提前初始化关键CSS变量，避免第一次渲染时的闪烁
const initCssVars = () => {
  const root = document.documentElement;
  
  // 默认主题
  const theme = localStorage.getItem('theme') || 'light';
  
  // 设置主题相关变量
  if (theme === 'dark') {
    root.style.setProperty('--app-bg-color', '#1d1d1f');
    root.style.setProperty('--app-text-color', '#f5f5f7');
    root.style.setProperty('--app-overlay-color', 'rgba(29, 29, 31, 0.8)');
    root.style.setProperty('--section-bg-color', '#2a2a2d');
    root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--nav-bg-color', 'rgba(29, 29, 31, 0.8)');
    root.style.setProperty('--nav-hover-bg', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--nav-active-bg', 'rgba(255, 255, 255, 0.15)');
    root.style.setProperty('--nav-active-text', '#ffffff');
  } else {
    root.style.setProperty('--app-bg-color', '#f5f5f7');
    root.style.setProperty('--app-text-color', '#1d1d1f');
    root.style.setProperty('--app-overlay-color', 'rgba(245, 245, 247, 0.8)');
    root.style.setProperty('--section-bg-color', 'white');
    root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--nav-bg-color', 'rgba(255, 255, 255, 0.8)');
    root.style.setProperty('--nav-hover-bg', 'rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--nav-active-bg', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--nav-active-text', '#000000');
  }
  
  // 背景透明度
  const backgroundOpacity = localStorage.getItem('backgroundOpacity') || '0.8';
  root.style.setProperty('--app-bg-opacity', backgroundOpacity);
  root.style.setProperty('--bg-opacity', backgroundOpacity);
  
  // 预先设置过渡效果
  root.style.setProperty('--transition-speed', '0.15s');
  
  // 设置颜色变量
  root.style.setProperty('--bg-color-dark', `rgba(29, 29, 31, ${backgroundOpacity})`);
  root.style.setProperty('--bg-color-light', `rgba(245, 245, 247, ${backgroundOpacity})`);
};

// 执行初始化
initCssVars();

// 添加性能监控
const enablePerformanceMonitoring = process.env.NODE_ENV !== 'production';
if (enablePerformanceMonitoring) {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    // 过滤掉React内部的一些不重要警告
    const ignorePatterns = [
      'forwardRef render functions',
      'inside a strict mode tree',
      'deprecated findDOMNode',
      'unstable_flushDiscreteUpdates'
    ];
    
    if (!ignorePatterns.some(pattern => 
        typeof args[0] === 'string' && args[0].includes(pattern))) {
      originalConsoleWarn(...args);
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </BrowserRouter>
); 