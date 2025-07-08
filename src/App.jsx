import React, { lazy, Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useTranslationContext } from './components/TranslationProvider';
import { invoke } from "@tauri-apps/api/core";
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Settings from './components/Settings';
import SourceManager from './components/SourceManager';
import DownloadManager from './components/DownloadManager';
import AppDetails from './components/AppDetails';
import { TauriDownloader, TauriDownloaderUtil } from './components/TauriDownloader';
import { fetchAppsFromSources, fetchAppsByCategory } from './services/sourceService';
import NotificationSystem from './components/NotificationSystem';
import ConfirmDialogContainer from './components/ConfirmDialog';
import PromptDialogContainer from './components/PromptDialog';
import Messages from './components/Messages';
import { initWebKitFixes } from './utils/wkwebviewUtils';

const AppContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['backgroundImage', 'backgroundOpacity'].includes(prop)
})`
  display: flex;
  height: 100vh;
  background-color: var(--app-bg-color);
  color: var(--app-text-color);
  background-image: ${props => props.backgroundImage ? `url(${props.backgroundImage})` : 'none'};
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  position: relative;
  overflow: hidden;
  
  /* Use CSS custom properties for dynamic values that can be updated directly */
  --bg-opacity: var(--app-bg-opacity, ${props => props.backgroundOpacity || 0.8});
  --bg-color-dark: rgba(29, 29, 31, var(--bg-opacity));
  --bg-color-light: rgba(245, 245, 247, var(--bg-opacity));
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--app-overlay-color);
    z-index: 0;
    pointer-events: none;
    will-change: opacity, transform, background-color;
    transition: background-color 0.15s ease-out;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const AppGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const AppCard = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 8px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const AppIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: ${props => props.bgColor || '#e8e8ed'};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-right: 16px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AppHeader = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
`;

const AppInfo = styled.div`
  flex: 1;
`;

const AppName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
`;

const AppDeveloper = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const AppDescription = styled.div`
  font-size: 13px;
  padding: 0 16px 16px;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#333'};
  line-height: 1.4;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 0;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const AppFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AppPrice = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const DownloadButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: ${props => {
    if (props.status === 'preparing') return '#ff9500';
    if (props.status === 'downloading') return '#ff9500';
    if (props.status === 'pausing') return '#ff9f0a';
    if (props.status === 'paused') return '#007aff';
    if (props.status === 'resuming') return '#ff9f0a';
    if (props.status === 'completed') return '#34c759';
    if (props.status === 'failed') return '#ff3b30';
    if (props.status === 'cancelled') return '#8e8e93';
    if (props.status === 'extracting') return '#af52de';
    if (props.status === 'extracted') return '#34c759';
    if (props.status === 'running') return '#30d158';
    if (props.status === 'processing') return '#ff9f0a';
    if (props.status === 'analyzingFile') return '#64d2ff';
    if (props.status === 'starting') return '#ff9500';
    return '#0066CC';
  }};
  color: white;
  min-width: 90px;
  min-height: 36px;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const DownloadProgress = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 6px 6px;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress || 0}%;
    background: linear-gradient(90deg, #00d4ff 0%, #0099cc 100%);
    border-radius: 0 0 6px 6px;
    transition: width 0.3s ease;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
  }
`;

const ProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 1;
  pointer-events: none;
`;

const DownloadDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border: 1px solid ${props => props.theme === 'dark' ? '#404040' : '#e0e0e0'};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
  padding: 8px;
  font-size: 12px;
  min-width: 200px;
`;

const DownloadInfo = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 8px;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
`;

const DownloadActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  background-color: ${props => {
    if (props.action === 'pause') return '#ff9500';
    if (props.action === 'resume') return '#007aff';
    if (props.action === 'open') return '#34c759';
    return '#666666';
  }};
  color: white;
  
  &:hover {
    opacity: 0.8;
  }
`;

// 新增列表视图的样式组件
const AppList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;

const ListAppCard = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 12px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const ListAppIcon = styled(AppIcon)`
  margin-right: 16px;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
`;

const ListAppInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const ListAppContent = styled.div`
  flex: 1;
  min-width: 0; // 确保文本可以正确截断
`;

const ListAppName = styled(AppName)`
  margin-bottom: 2px;
`;

const ListAppDeveloper = styled(AppDeveloper)`
  margin-bottom: 4px;
`;

const ListAppDescription = styled(AppDescription)`
  padding: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  font-size: 12px;
`;

const ListAppActions = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  flex-shrink: 0;
`;

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ViewButton = styled.button`
  background-color: ${props => props.active ? '#f5f5f7' : 'transparent'};
  border: none;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.active ? '#f5f5f7' : '#f5f5f710'};
  }

  svg {
    width: 16px;
    height: 16px;
    fill: #1d1d1f;
  }
`;

// 添加性能监控函数 - 仅在开发环境使用
const measurePerformance = (label, fn) => {
  if (process.env.NODE_ENV !== 'production') {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
  } else {
    return fn();
  }
};

// 优化图像预加载，添加缓存机制
const imageCache = new Map();
const preloadImage = (url) => {
  if (!url) return Promise.resolve();
  
  // 如果已经在缓存中，直接返回缓存的Promise
  if (imageCache.has(url)) {
    return imageCache.get(url);
  }
  
  // 创建新的加载Promise并缓存
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 成功后添加到缓存
      imageCache.set(url, Promise.resolve());
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  }).catch(err => {
    // 加载失败时从缓存中移除
    imageCache.delete(url);
    console.warn(`Failed to preload image: ${url}`, err);
  });
  
  // 存储Promise到缓存
  imageCache.set(url, promise);
  return promise;
};

// 预加载主题相关的CSS变量
const preloadThemeVariables = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.style.setProperty('--app-bg-color', '#1d1d1f');
    root.style.setProperty('--app-text-color', '#f5f5f7');
    root.style.setProperty('--app-overlay-color', 'var(--bg-color-dark)');
  } else {
    root.style.setProperty('--app-bg-color', '#f5f5f7');
    root.style.setProperty('--app-text-color', '#1d1d1f');
    root.style.setProperty('--app-overlay-color', 'var(--bg-color-light)');
  }
};

// 添加页面加载状态组件
const PageLoader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--app-text-color);
  opacity: 0.7;
`;

// 添加渐变动画
const FadeIn = styled.div`
  animation: fadeIn 0.3s ease-in;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

// 使用 lazy 加载组件
const LazySettings = lazy(() => {
  // 人为延迟100ms，确保UI先渲染
  return new Promise(resolve => 
    setTimeout(() => resolve(import('./components/Settings')), 100)
  );
});

const LazySourceManager = lazy(() => {
  return new Promise(resolve => 
    setTimeout(() => resolve(import('./components/SourceManager')), 100)
  );
});

const LazyDownloadManager = lazy(() => {
  return new Promise(resolve => 
    setTimeout(() => resolve(import('./components/DownloadManager')), 100)
  );
});

const LazyAppDetails = lazy(() => {
  return new Promise(resolve => 
    setTimeout(() => resolve(import('./components/AppDetails')), 100)
  );
});

const App = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useTranslationContext();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [backgroundImage, setBackgroundImage] = useState(() => {
    return localStorage.getItem('backgroundImage') || '';
  });
  const [backgroundOpacity, setBackgroundOpacity] = useState(() => {
    return parseFloat(localStorage.getItem('backgroundOpacity') || '0.8');
  });
  const [uiBackgroundOpacity, setUiBackgroundOpacity] = useState(() => {
    return parseFloat(localStorage.getItem('backgroundOpacity') || '0.8');
  });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'grid';
  });
  const [currentCategory, setCurrentCategory] = useState('dev-tools');
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadManagerVisible, setIsDownloadManagerVisible] = useState(false);
  const [isMessagesVisible, setIsMessagesVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const downloadManagerRef = useRef(null);
  const [downloadStates, setDownloadStates] = useState(() => {
    try {
      const saved = localStorage.getItem('downloadStates');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('读取下载状态失败:', error);
      return {};
    }
  }); // 存储每个应用的下载状态
  const [appActionStates, setAppActionStates] = useState(() => {
    try {
      const saved = localStorage.getItem('appActionStates');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('读取应用状态失败:', error);
      return {};
    }
  }); // 存储每个应用的操作状态（安装/打开）
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(null); // 控制下载详情下拉框显示
  
  // 使用防抖，避免频繁更新localStorage
  const debounceTimeoutRef = useRef(null);
  
  // 节流保存 - 只有当值真正改变时才执行存储
  const saveToLocalStorage = useCallback((key, value, prevValue) => {
    if (value !== prevValue) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(key, typeof value === 'string' ? value : value.toString());
      }, 50); // 50ms的防抖延迟
    }
  }, []);

  // 更新下载状态
  const updateDownloadState = useCallback((appId, state) => {
    setDownloadStates(prev => {
      const newStates = {
        ...prev,
        [appId]: { ...prev[appId], ...state }
      };
      // 保存到localStorage
      try {
        localStorage.setItem('downloadStates', JSON.stringify(newStates));
      } catch (error) {
        console.error('保存下载状态失败:', error);
      }
      return newStates;
    });
  }, []);

  // 获取下载状态
  const getDownloadState = useCallback((appId) => {
    return downloadStates[appId] || { status: 'idle', progress: 0, speed: '', taskId: null };
  }, [downloadStates]);

  // 更新应用操作状态
  const updateAppActionState = useCallback((appId, state) => {
    setAppActionStates(prev => {
      const newStates = {
        ...prev,
        [appId]: { ...prev[appId], ...state }
      };
      // 保存到localStorage
      try {
        localStorage.setItem('appActionStates', JSON.stringify(newStates));
      } catch (error) {
        console.error('保存应用状态失败:', error);
      }
      return newStates;
    });
  }, []);

  // 获取应用操作状态
  const getAppActionState = useCallback((appId) => {
    return appActionStates[appId] || { action: '下载', isInstalled: false };
  }, [appActionStates]);

  // 检查应用安装状态并更新操作文本
  const checkAppInstallStatus = useCallback(async (appId, filePath) => {
    if (!filePath) return;
    
    try {
      // 首先检查文件是否存在
      const fileExists = await invoke('file_exists', { path: filePath });
      
      if (!fileExists) {
        // 如果安装程序文件被删除，自动切换到下载状态
        console.log('安装程序文件不存在，切换到下载状态:', filePath);
        updateAppActionState(appId, { action: '下载', isInstalled: false });
        // 同时清除下载状态，允许重新下载
        updateDownloadState(appId, { status: 'idle', progress: 0, filePath: null, taskId: null });
        return;
      }
      
      const action = await invoke('get_file_action', { filePath });
      updateAppActionState(appId, { 
        action, 
        isInstalled: action === '运行' || action === '打开'
      });
    } catch (error) {
      console.error('检查应用安装状态失败:', error);
      updateAppActionState(appId, { action: '下载', isInstalled: false });
    }
  }, [updateAppActionState, updateDownloadState]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  // 获取下载按钮文本
  const getDownloadButtonText = useCallback((appId) => {
    const state = getDownloadState(appId);
    switch (state.status) {
      case 'preparing':
        return t('downloadManager.preparingDownload') || '准备中';
      case 'downloading':
        return t('downloadManager.downloadingFile') || '下载中';
      case 'pausing':
        return t('downloadManager.pausing') || '暂停中';
      case 'paused':
        return t('downloadManager.paused') || '已暂停';
      case 'resuming':
        return t('downloadManager.resuming') || '恢复中';
      case 'completed':
        const actionState = getAppActionState(appId);
        switch(actionState.action) {
          case '安装': return '安装';
          case '运行': return '运行';
          case '打开': return t('downloadManager.open') || '打开';
          default: return t('downloadManager.open') || '打开';
        }
      case 'failed':
        return t('downloadManager.failed') || '失败';
      case 'cancelled':
        return t('downloadManager.cancelled') || '已取消';
      case 'extracting':
        return t('downloadManager.extracting') || '解压中';
      case 'extracted':
        return t('downloadManager.extracted') || '解压完成';
      case 'running':
        return t('downloadManager.running') || '运行中';
      case 'processing':
        return t('downloadManager.processing') || '处理中';
      case 'analyzingFile':
        return t('downloadManager.analyzingFile') || '分析中';
      case 'starting':
        return t('downloadManager.starting') || '启动中';
      default:
        return t('app.download') || '下载';
    }
  }, [getDownloadState, getAppActionState, t]);

  // 使用useEffect带上之前的值进行比较
  useEffect(() => {
    saveToLocalStorage('theme', theme);
  }, [theme, saveToLocalStorage]);

  useEffect(() => {
    saveToLocalStorage('backgroundImage', backgroundImage);
  }, [backgroundImage, saveToLocalStorage]);

  useEffect(() => {
    saveToLocalStorage('backgroundOpacity', backgroundOpacity.toString());
  }, [backgroundOpacity, saveToLocalStorage]);

  useEffect(() => {
    saveToLocalStorage('viewMode', viewMode);
  }, [viewMode, saveToLocalStorage]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'appSources' || e.key === 'blobSources') {
        loadApps(currentCategory);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentCategory]);

  // 添加渲染优化标志
  const isInitialRender = useRef(true);
  const pendingStateUpdates = useRef(0);
  
  // 优化状态批量更新
  const batchedStateUpdate = useCallback((updateFn) => {
    pendingStateUpdates.current += 1;
    
    // 执行状态更新
    updateFn();
    
    // 完成一个更新
    pendingStateUpdates.current -= 1;
    
    // 如果所有更新完成，触发一次强制渲染
    if (pendingStateUpdates.current === 0) {
      requestAnimationFrame(() => {
        // 可以添加其他渲染后的操作
      });
    }
  }, []);
  
  // 添加防抖的CSS变量更新函数
  const debouncedCssVarUpdate = useCallback((varName, value) => {
    if (typeof value === 'undefined') return;
    
    // 批量处理CSS变量更新
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty(varName, value);
    });
  }, []);
  
  // WebKit兼容性初始化（支持macOS、iOS、Linux）
  useEffect(() => {
    // 初始化WebKit修复（支持所有WebKit平台）
    const cleanup = initWebKitFixes({
      autoRepaint: true,
      repaintDelay: 100,
      selectors: ['[data-sidebar="true"]', '#root', 'body', '[data-app-container="true"]']
    });
    
    return cleanup;
  }, []);
  
  // 优化初始加载 - 使用优先级队列加载资源
  useEffect(() => {
    if (!isInitialRender.current) return;
    
    const loadPriority1 = () => {
      // 高优先级：预加载主题和UI关键资源
      preloadThemeVariables(theme);
      debouncedCssVarUpdate('--app-bg-opacity', backgroundOpacity);
    };
    
    const loadPriority2 = () => {
      // 中优先级：当前背景图
      if (backgroundImage) {
        return preloadImage(backgroundImage);
      }
      return Promise.resolve();
    };
    
    const loadPriority3 = () => {
      // 低优先级：预加载默认背景图片和其他资源
      const defaultBackgrounds = [
        'https://cdn.pixabay.com/photo/2020/10/27/08/00/mountains-5689938_1280.png',
        'https://cdn.pixabay.com/photo/2012/08/27/14/19/mountains-55067_1280.png',
        'https://media.istockphoto.com/id/1145054673/zh/%E5%90%91%E9%87%8F/%E6%B5%B7%E7%81%98.jpg'
      ];
      
      // 使用Promise.all但不等待结果，允许在后台加载
      Promise.all(defaultBackgrounds.map(preloadImage))
        .catch(() => console.log('Some background images failed to preload'));
    };
    
    // 顺序执行优先级加载
    loadPriority1();
    loadPriority2().finally(() => {
      // 不管结果如何，继续加载低优先级资源
      loadPriority3();
      // 标记初始渲染完成
      isInitialRender.current = false;
    });
  }, [theme, backgroundImage, backgroundOpacity, debouncedCssVarUpdate]);

  // 优化应用加载
  const loadApps = useCallback(async (category) => {
    if (!category) return;
    
    setLoading(true);
    try {
      let appsList = [];
      let cachedApps = sessionStorage.getItem(`apps_${category}`);
      
      if (cachedApps) {
        appsList = JSON.parse(cachedApps);
        setApps(appsList);
        setFilteredApps(appsList);
        setLoading(false);
      }
      
      // 即使有缓存也重新获取最新数据
      if (category === 'dev-tools') {
        appsList = await fetchAppsFromSources();
      } else {
        appsList = await fetchAppsByCategory(category);
      }
      
      sessionStorage.setItem(`apps_${category}`, JSON.stringify(appsList));
      setApps(appsList);
      setFilteredApps(appsList);
      
      // 初始化应用安装状态
      for (const app of appsList) {
        const downloadState = getDownloadState(app.id);
        if (downloadState.status === 'completed' && downloadState.filePath) {
          // 对于已下载完成的应用，检查其安装状态
          await checkAppInstallStatus(app.id, downloadState.filePath);
        }
      }
    } catch (error) {
      console.error('加载应用失败:', error);
    } finally {
      setLoading(false);
    }
  }, [getDownloadState, checkAppInstallStatus]);

  useEffect(() => {
    if (['dev-tools', 'software', 'games', 'ai-models'].includes(currentCategory)) {
      loadApps(currentCategory);
    }
  }, [currentCategory]);

  // 优化搜索性能
  const debouncedSearch = useCallback(
    (() => {
      let timer = null;
      return (term) => {
        if (timer) clearTimeout(timer);
        
        // 立即更新搜索词以提供用户反馈
        setSearchTerm(term);
        
        // 如果搜索词为空，立即清空结果
        if (!term.trim()) {
          setFilteredApps(apps);
          return;
        }
        
        // 延迟实际搜索以减少频繁更新
        timer = setTimeout(() => {
          requestAnimationFrame(() => {
            const searchResults = apps.filter(app => {
              const searchString = `${app.name} ${app.description} ${app.developer || ''}`.toLowerCase();
              return searchString.includes(term.toLowerCase());
            });
            
            setFilteredApps(searchResults);
          });
        }, 150); // 150ms的防抖延迟
      };
    })(),
    [apps]
  );
  
  // 替换原来的handleSearch
  const handleSearch = debouncedSearch;

  const handleAppClick = (app) => {
    setSelectedApp(app);
  };

  const handleBackToList = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const handleCategorySelect = useCallback((category) => {
    // 如果选择了相同的类别，不做任何操作
    if (category === currentCategory) return;
    
    // 重置状态
    setSearchTerm('');
    setIsDownloadManagerVisible(false);
    setSelectedApp(null);
    
    // 先设置页面为加载状态
    setPageReady(false);
    
    // 使用requestAnimationFrame确保UI先渲染
    requestAnimationFrame(() => {
      // 切换类别
      setCurrentCategory(category);
    });
  }, [currentCategory]);

  // Initialize theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const updateThemeVariables = () => {
      if (theme === 'dark') {
        root.style.setProperty('--app-bg-color', '#1d1d1f');
        root.style.setProperty('--app-text-color', '#f5f5f7');
        root.style.setProperty('--app-overlay-color', 'var(--bg-color-dark)');
      } else {
        root.style.setProperty('--app-bg-color', '#f5f5f7');
        root.style.setProperty('--app-text-color', '#1d1d1f');
        root.style.setProperty('--app-overlay-color', 'var(--bg-color-light)');
      }
    };

    updateThemeVariables();
    
    // Add transition to the entire app for smoother changes
    root.style.setProperty('--transition-speed', '0.15s');
    root.style.setProperty('--app-bg-opacity', backgroundOpacity);
    
    // Cleanup
    return () => {
      root.style.removeProperty('--app-bg-color');
      root.style.removeProperty('--app-text-color');
      root.style.removeProperty('--app-overlay-color');
      root.style.removeProperty('--transition-speed');
      root.style.removeProperty('--app-bg-opacity');
    };
  }, [theme, backgroundOpacity]);

  // Optimize handleThemeChange to use CSS variables
  const handleThemeChange = useCallback((newTheme) => {
    if (newTheme !== theme) {
      // Update theme immediately through CSS variables
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.style.setProperty('--app-bg-color', '#1d1d1f');
        root.style.setProperty('--app-text-color', '#f5f5f7');
        root.style.setProperty('--app-overlay-color', 'var(--bg-color-dark)');
      } else {
        root.style.setProperty('--app-bg-color', '#f5f5f7');
        root.style.setProperty('--app-text-color', '#1d1d1f');
        root.style.setProperty('--app-overlay-color', 'var(--bg-color-light)');
      }
      
      // Update React state after visual change
      requestAnimationFrame(() => {
        setTheme(newTheme);
      });
    }
  }, [theme]);

  const handleToggleDownloadManager = useCallback(() => {
    setIsDownloadManagerVisible(!isDownloadManagerVisible);
    // 如果打开下载管理器，关闭消息页面
    if (!isDownloadManagerVisible) {
      setIsMessagesVisible(false);
    }
  }, [isDownloadManagerVisible]);

  const handleToggleMessages = useCallback(() => {
    setIsMessagesVisible(!isMessagesVisible);
    // 如果打开消息页面，关闭下载管理器
    if (!isMessagesVisible) {
      setIsDownloadManagerVisible(false);
    }
  }, [isMessagesVisible]);

  // 处理下载控制
  const handleDownloadControl = useCallback(async (app, action) => {
    const state = getDownloadState(app.id);
    
    try {
      switch (action) {
        case 'pause':
          if (state.taskId) {
            // 先更新UI状态为正在暂停
            updateDownloadState(app.id, { status: 'pausing' });
            await invoke('pause_download', { taskId: state.taskId });
            // 暂停成功后更新状态
            updateDownloadState(app.id, { status: 'paused' });
          }
          break;
        case 'resume':
          if (state.taskId) {
            // 获取后端真实状态确认任务确实是暂停状态
            try {
              const task = await invoke('get_download_progress', { taskId: state.taskId });
              if (task && task.status !== 'Paused') {
                console.warn('任务状态不是暂停状态，无法恢复:', task.status);
                // 同步真实状态
                if (task.status === 'Downloading') {
                  updateDownloadState(app.id, { status: 'downloading' });
                } else if (task.status === 'Completed') {
                  updateDownloadState(app.id, { status: 'completed' });
                } else if (task.status === 'Failed' || task.status === 'Error') {
                  updateDownloadState(app.id, { status: 'failed' });
                }
                return;
              }
            } catch (error) {
              console.error('获取任务状态失败:', error);
            }
            
            // 先更新UI状态为正在恢复
            updateDownloadState(app.id, { status: 'resuming' });
            await invoke('resume_download', { taskId: state.taskId });
            // 恢复成功后更新状态
            updateDownloadState(app.id, { status: 'downloading' });
          }
          break;
        case 'cancel':
          if (state.taskId) {
            await invoke('cancel_download', { taskId: state.taskId });
            // 清除taskId到appId的映射
            if (window.taskIdToAppIdMap && window.taskIdToAppIdMap.has(state.taskId)) {
              window.taskIdToAppIdMap.delete(state.taskId);
            }
            updateDownloadState(app.id, { status: 'idle', progress: 0, taskId: null });
          }
          break;
        case 'open':
          if (state.status === 'completed' && state.filePath) {
            try {
              await invoke('open_file', { path: state.filePath });
            } catch (error) {
              console.error('打开文件失败:', error);
              window.showError && window.showError('无法打开文件: ' + error);
            }
          }
          break;
      }
    } catch (error) {
      console.error(`下载控制操作失败 (${action}):`, error);
      window.showError && window.showError(`操作失败: ${error}`);
      // 操作失败时恢复之前的状态
      if (action === 'pause') {
        updateDownloadState(app.id, { status: 'downloading' });
      } else if (action === 'resume') {
        updateDownloadState(app.id, { status: 'paused' });
      }
    }
  }, [getDownloadState, updateDownloadState]);

  // 处理打开文件或安装应用
  const handleOpenFile = useCallback(async (app) => {
    const downloadState = getDownloadState(app.id);
    const actionState = getAppActionState(app.id);
    
    if (downloadState.status === 'completed' && downloadState.filePath) {
      try {
        // 首先检查文件是否存在
        const fileExists = await invoke('file_exists', { path: downloadState.filePath });
        
        if (!fileExists) {
          // 如果文件被删除，自动切换到下载状态
          console.log('文件不存在，切换到下载状态:', downloadState.filePath);
          updateAppActionState(app.id, { action: '下载', isInstalled: false });
          updateDownloadState(app.id, { status: 'idle', progress: 0, filePath: null, taskId: null });
          showToast('文件已被删除，请重新下载', 'warning');
          return;
        }
        
        if (actionState.action === '安装') {
          // 运行安装程序
          await invoke('run_installer', { filePath: downloadState.filePath });
          showToast('正在运行安装程序...', 'info');
          // 安装后重新检查状态，使用多次检查确保状态更新
          const checkInstallation = async () => {
            await checkAppInstallStatus(app.id, downloadState.filePath);
            // 如果状态仍然是安装，继续检查
            const newState = getAppActionState(app.id);
            if (newState.action === '安装') {
              setTimeout(checkInstallation, 3000); // 3秒后再次检查
            }
          };
          setTimeout(checkInstallation, 2000); // 2秒后开始检查
        } else {
          // 打开文件或运行应用
          await invoke('open_file', { path: downloadState.filePath });
          showToast('正在打开应用...', 'info');
        }
      } catch (error) {
        console.error('操作失败:', error);
        showToast(`操作失败: ${error}`, 'error');
        
        // 如果是文件不存在的错误，也切换到下载状态
        if (error.toString().includes('文件不存在') || error.toString().includes('No such file')) {
          console.log('文件操作失败，可能文件已被删除，切换到下载状态');
          updateAppActionState(app.id, { action: '下载', isInstalled: false });
          updateDownloadState(app.id, { status: 'idle', progress: 0, filePath: null, taskId: null });
        }
      }
    } else {
      showToast('文件尚未下载完成或文件路径不存在', 'warning');
    }
  }, [getDownloadState, getAppActionState, checkAppInstallStatus, updateAppActionState, updateDownloadState]);

  // 防抖处理，防止快速连续点击
  const downloadDebounceRef = useRef(new Set());
  
  const handleDownload = useCallback(async (app) => {
    // 防抖检查
    if (downloadDebounceRef.current.has(app.id)) {
      return;
    }
    
    const currentState = getDownloadState(app.id);
    
    // 如果已经在下载中，显示下载详情
    if (currentState.status === 'downloading' || currentState.status === 'paused') {
      setShowDownloadDropdown(showDownloadDropdown === app.id ? null : app.id);
      return;
    }
    
    // 如果已完成，打开文件
    if (currentState.status === 'completed') {
      handleDownloadControl(app, 'open');
      return;
    }
    
    if (!app.downloadUrl) {
      window.showError && window.showError(t('app.noDownloadUrl'));
      return;
    }

    // 添加到防抖集合
    downloadDebounceRef.current.add(app.id);
    
    // 立即更新状态为准备中，提供即时反馈
    updateDownloadState(app.id, { status: 'preparing', progress: 0 });

    try {
      // 使用requestAnimationFrame优化UI更新
      const showToast = (message, bgColor = '#0066CC') => {
        requestAnimationFrame(() => {
          const toast = document.createElement('div');
          toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: ${bgColor};
            color: white;
            border-radius: 4px;
            z-index: 9999;
            transition: opacity 0.5s ease;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          `;
          toast.textContent = message;
          document.body.appendChild(toast);
          
          // 自动移除toast
          setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
              if (document.body.contains(toast)) {
                document.body.removeChild(toast);
              }
            }, 500);
          }, 3000);
        });
      };
      
      // 更新下载状态为开始
      updateDownloadState(app.id, { status: 'downloading', progress: 0 });
      
      // 使用Tauri下载管理器进行下载
      try {
        console.log('开始使用Tauri下载管理器下载:', app.name);
        console.log('下载URL:', app.downloadUrl);
        
        // 从URL提取文件名，如果没有扩展名则使用app.name
        let fileName = app.name;
        try {
          const urlPath = new URL(app.downloadUrl).pathname;
          const urlFileName = urlPath.split('/').pop();
          if (urlFileName && urlFileName.includes('.')) {
            fileName = decodeURIComponent(urlFileName);
          }
        } catch (e) {
          console.warn('无法从URL解析文件名，使用应用名称:', e);
        }
        
        console.log('使用文件名:', fileName);
        
        // 创建下载任务
        const taskId = await invoke('create_download_task', {
          url: app.downloadUrl,
          fileName: fileName,
          downloadPath: null // 使用默认下载路径
        });
        
        console.log('创建下载任务成功，任务ID:', taskId);
        
        // 更新状态包含taskId
        updateDownloadState(app.id, { taskId, fileName });
        
        // 创建taskId到appId的映射，用于删除时清除状态
        if (!window.taskIdToAppIdMap) {
          window.taskIdToAppIdMap = new Map();
        }
        window.taskIdToAppIdMap.set(taskId, app.id);
        
        // 立即开始下载
        const startResult = await invoke('start_download', { taskId });
        
        console.log('下载启动成功:', app.name, '结果:', startResult);
        
        // 显示成功提示
        showToast(`下载已开始: ${app.name}`, '#28a745');
        
      } catch (downloadError) {
        console.error('使用下载管理器失败，回退到内置下载:', downloadError);
        
        // 更新状态为失败
        updateDownloadState(app.id, { status: 'failed' });
        
        // 显示错误提示
        showToast(`下载失败: ${app.name}`, '#dc3545');
        
        // 回退到原有的下载方式
        if (downloadManagerRef.current) {
          console.log(t('downloadManager.starting'));
          downloadManagerRef.current.startDownload({
            name: app.name,
            downloadUrl: app.downloadUrl
          });
        } else {
          console.log(t('downloadManager.downloading'));
          TauriDownloaderUtil.downloadFile(app.downloadUrl, app.name);
        }
      }
      
    } catch (error) {
      console.error(t('downloadManager.failed'), error);
      window.showError && window.showError(`${t('downloadManager.failed')}: ${app.name} - ${error.message || t('errors.unknownError')}`);
    } finally {
      // 清除防抖状态，允许重新点击
      setTimeout(() => {
        downloadDebounceRef.current.delete(app.id);
      }, 1000); // 1秒后清除防抖
    }
  }, [t, downloadManagerRef, getDownloadState, updateDownloadState, handleDownloadControl, showDownloadDropdown]);

  // 优化背景图片切换
  const handleBackgroundImageChange = useCallback((imageUrl, opacity) => {
    // 如果新值与当前值相同，跳过更新
    if (imageUrl === backgroundImage && 
        opacity !== undefined && 
        Math.abs(opacity - backgroundOpacity) < 0.01) {
      return;
    }
    
    // 准备加载新图片（如果有）
    const imageLoadPromise = imageUrl ? preloadImage(imageUrl) : Promise.resolve();
    
    // 立即更新CSS变量以提供视觉反馈
    if (opacity !== undefined) {
      debouncedCssVarUpdate('--app-bg-opacity', opacity);
    }
    
    // 等待图片加载完成后更新状态
    imageLoadPromise.then(() => {
      batchedStateUpdate(() => {
        // 批量更新状态减少重渲染
        if (imageUrl !== backgroundImage) {
          setBackgroundImage(imageUrl);
        }
        
        if (opacity !== undefined && Math.abs(opacity - backgroundOpacity) >= 0.01) {
          setBackgroundOpacity(opacity);
          setUiBackgroundOpacity(opacity);
          localStorage.setItem('backgroundOpacity', opacity.toString());
        }
      });
    });
  }, [backgroundImage, backgroundOpacity, batchedStateUpdate, debouncedCssVarUpdate]);
  
  // 使用useCallback优化handleViewModeChange函数
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  }, []);

  // 使用useEffect保存视图模式到localStorage
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Handle language change
  const handleLanguageChange = useCallback((language) => {
    changeLanguage(language);
  }, [changeLanguage]);

  // 添加页面加载状态
  const [pageReady, setPageReady] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const prevCategoryRef = useRef(null);
  
  // 处理页面切换
  useEffect(() => {
    // 如果类别已经改变
    if (prevCategoryRef.current !== currentCategory) {
      // 记录当前页面开始加载
      setContentLoading(true);
      
      // 先将页面标记为准备好，立即进入页面
      setPageReady(true);
      
      // 使用requestIdleCallback在浏览器空闲时加载数据
      // 不支持requestIdleCallback的浏览器使用setTimeout作为降级方案
      const idleCallback = window.requestIdleCallback || setTimeout;
      
      const loadContent = () => {
        // 在空闲时加载数据
        if (['dev-tools', 'software', 'games', 'ai-models'].includes(currentCategory)) {
          loadApps(currentCategory).finally(() => {
            // 数据加载完成，标记内容已加载
            setContentLoading(false);
          });
        } else {
          // 非列表类别页面，直接标记为加载完成
          setContentLoading(false);
        }
        // 更新上一个类别
        prevCategoryRef.current = currentCategory;
      };
      
      // 延迟加载数据
      idleCallback(loadContent, { timeout: 300 });
    }
  }, [currentCategory, loadApps]);

  // 渲染网格视图
  const renderGridView = useCallback(() => {
    return (
      <AppGrid>
        {filteredApps.map(app => (
          <AppCard 
            key={app.id} 
            theme={theme}
            onClick={() => handleAppClick(app)}
          >
            <AppHeader>
              <AppIcon bgColor={app.iconBgColor}>
                <img src={app.icon} alt={app.name} />
              </AppIcon>
              <AppInfo>
                <AppName>{app.name}</AppName>
                <AppDeveloper theme={theme}>{app.developer || t('app.noDescription')}</AppDeveloper>
              </AppInfo>
            </AppHeader>
            <AppDescription theme={theme}>{app.description}</AppDescription>
            <AppFooter>
              <AppPrice theme={theme}>{app.price === 0 ? '' : `￥${app.price}`}</AppPrice>
              <div style={{ position: 'relative' }} data-download-dropdown>
                {(() => {
                  const downloadState = getDownloadState(app.id);
                  return (
                    <DownloadButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            // 防止在过渡状态时重复点击
                            if (downloadState.status === 'pausing' || downloadState.status === 'resuming') {
                              return;
                            }
                            if (downloadState.status === 'completed') {
                              handleOpenFile(app);
                            } else if (downloadState.status === 'downloading') {
                              handleDownloadControl(app, 'pause');
                            } else if (downloadState.status === 'paused') {
                              handleDownloadControl(app, 'resume');
                            } else {
                              handleDownload(app);
                            }
                          }}
                          status={downloadState.status}
                          disabled={downloadState.status === 'pausing' || downloadState.status === 'resuming'}
                        >
                      {downloadState.status === 'downloading' ? (
                        <>
                          <DownloadProgress progress={downloadState.progress} />
                          <ProgressText>{Math.round(downloadState.progress || 0)}%</ProgressText>
                        </>
                      ) : (
                        getDownloadButtonText(app.id)
                      )}
                    </DownloadButton>
                  );
                })()}
                
                {showDownloadDropdown === app.id && (() => {
                  const dropdownState = getDownloadState(app.id);
                  return (
                    <DownloadDropdown theme={theme}>
                         <DownloadInfo theme={theme}>
                           <div>{t('downloadManager.status')}: {t(`downloadManager.${dropdownState.status}`)}</div>
                           <div>{t('downloadManager.progress')}: {dropdownState.progress}%</div>
                           {dropdownState.speed && (
                             <div>{t('downloadManager.speed')}: {formatFileSize(dropdownState.speed)}/s</div>
                           )}
                           {dropdownState.totalSize && (
                             <div>{t('downloadManager.size')}: {formatFileSize(dropdownState.totalSize)}</div>
                           )}
                         </DownloadInfo>
                         <DownloadActions>
                           {dropdownState.status === 'downloading' && (
                             <ActionButton action="pause" onClick={() => handleDownloadControl(app, 'pause')}>
                               {t('downloadManager.pause')}
                             </ActionButton>
                           )}
                           {dropdownState.status === 'paused' && (
                             <ActionButton action="resume" onClick={() => handleDownloadControl(app, 'resume')}>
                               {t('downloadManager.resume')}
                             </ActionButton>
                           )}
                           {(dropdownState.status === 'downloading' || 
                             dropdownState.status === 'paused') && (
                             <ActionButton onClick={() => handleDownloadControl(app, 'cancel')}>
                               {t('downloadManager.cancel')}
                             </ActionButton>
                           )}
                           {dropdownState.status === 'completed' && (
                             <>
                               <ActionButton action="open" onClick={() => handleOpenFile(app)}>
                                 {(() => {
                                   const actionState = getAppActionState(app.id);
                                   switch(actionState.action) {
                                     case '安装': return '安装';
                                     case '运行': return '运行';
                                     case '打开': return t('downloadManager.open');
                                     default: return t('downloadManager.open');
                                   }
                                 })()}
                               </ActionButton>
                               <ActionButton 
                                 onClick={() => checkAppInstallStatus(app.id, dropdownState.filePath)}
                                 title="刷新应用状态"
                               >
                                 🔄
                               </ActionButton>
                             </>
                           )}
                         </DownloadActions>
                       </DownloadDropdown>
                  );
                })()}
              </div>
            </AppFooter>
          </AppCard>
        ))}
      </AppGrid>
    );
  }, [filteredApps, theme, handleAppClick, handleDownload, t]);

  // 渲染列表视图
  const renderListView = useCallback(() => {
    return (
      <AppList>
        {filteredApps.map(app => (
          <ListAppCard 
            key={app.id} 
            theme={theme}
            onClick={() => handleAppClick(app)}
          >
            <ListAppIcon bgColor={app.iconBgColor}>
              <img src={app.icon} alt={app.name} />
            </ListAppIcon>
            <ListAppInfo>
              <ListAppContent>
                <ListAppName>{app.name}</ListAppName>
                <ListAppDeveloper theme={theme}>{app.developer || t('app.noDescription')}</ListAppDeveloper>
                <ListAppDescription theme={theme}>{app.description}</ListAppDescription>
              </ListAppContent>
              <ListAppActions>
                <AppPrice theme={theme} style={{ marginRight: '12px' }}>
                  {app.price === 0 ? '' : `￥${app.price}`}
                </AppPrice>
                <div style={{ position: 'relative' }} data-download-dropdown>
                  {(() => {
                    const listDownloadState = getDownloadState(app.id);
                    return (
                      <>
                        <DownloadButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            // 防止在过渡状态时重复点击
                            if (listDownloadState.status === 'pausing' || listDownloadState.status === 'resuming') {
                              return;
                            }
                            if (listDownloadState.status === 'completed') {
                              handleOpenFile(app);
                            } else if (listDownloadState.status === 'downloading') {
                              handleDownloadControl(app, 'pause');
                            } else if (listDownloadState.status === 'paused') {
                              handleDownloadControl(app, 'resume');
                            } else {
                              handleDownload(app);
                            }
                          }}
                          status={listDownloadState.status}
                          disabled={listDownloadState.status === 'pausing' || listDownloadState.status === 'resuming'}
                        >
                          {listDownloadState.status === 'downloading' ? (
                            <>
                              <DownloadProgress progress={listDownloadState.progress} />
                              <ProgressText>{Math.round(listDownloadState.progress || 0)}%</ProgressText>
                            </>
                          ) : (
                            getDownloadButtonText(app.id)
                          )}
                        </DownloadButton>
                        
                        {showDownloadDropdown === app.id && (
                          <DownloadDropdown theme={theme}>
                             <DownloadInfo theme={theme}>
                               <div>{t('downloadManager.status')}: {t(`downloadManager.${listDownloadState.status}`)}</div>
                               <div>{t('downloadManager.progress')}: {listDownloadState.progress}%</div>
                               {listDownloadState.speed && (
                                 <div>{t('downloadManager.speed')}: {formatFileSize(listDownloadState.speed)}/s</div>
                               )}
                               {listDownloadState.totalSize && (
                                 <div>{t('downloadManager.size')}: {formatFileSize(listDownloadState.totalSize)}</div>
                               )}
                             </DownloadInfo>
                             <DownloadActions>
                               {listDownloadState.status === 'downloading' && (
                                 <ActionButton action="pause" onClick={() => handleDownloadControl(app, 'pause')}>
                                   {t('downloadManager.pause')}
                                 </ActionButton>
                               )}
                               {listDownloadState.status === 'paused' && (
                                 <ActionButton action="resume" onClick={() => handleDownloadControl(app, 'resume')}>
                                   {t('downloadManager.resume')}
                                 </ActionButton>
                               )}
                               {(listDownloadState.status === 'downloading' || 
                                 listDownloadState.status === 'paused') && (
                                 <ActionButton onClick={() => handleDownloadControl(app, 'cancel')}>
                                   {t('downloadManager.cancel')}
                                 </ActionButton>
                               )}
                               {listDownloadState.status === 'completed' && (
                                 <>
                                   <ActionButton action="open" onClick={() => handleOpenFile(app)}>
                                     {(() => {
                                       const actionState = getAppActionState(app.id);
                                       switch(actionState.action) {
                                         case '安装': return '安装';
                                         case '运行': return '运行';
                                         case '打开': return t('downloadManager.open');
                                         default: return t('downloadManager.open');
                                       }
                                     })()}
                                   </ActionButton>
                                   <ActionButton 
                                     onClick={() => checkAppInstallStatus(app.id, listDownloadState.filePath)}
                                     title="刷新应用状态"
                                   >
                                     🔄
                                   </ActionButton>
                                 </>
                               )}
                             </DownloadActions>
                           </DownloadDropdown>
                        )}
                      </>
                    );
                  })()}
                </div>
              </ListAppActions>
            </ListAppInfo>
          </ListAppCard>
        ))}
      </AppList>
    );
  }, [filteredApps, theme, handleAppClick, handleDownload, t]);

  // 修改页面内容渲染逻辑
  const renderContent = useCallback(() => {
    // 如果页面还没准备好，显示加载状态
    if (!pageReady) {
      return <PageLoader>准备页面...</PageLoader>;
    }
    
    // 根据不同类别渲染内容
    if (currentCategory === 'settings') {
      return (
        <Suspense fallback={<PageLoader>加载设置...</PageLoader>}>
          <FadeIn>
            <LazySettings 
              theme={theme} 
              language={currentLanguage}
              viewMode={viewMode}
              onThemeChange={handleThemeChange}
              onLanguageChange={handleLanguageChange}
              onViewModeChange={handleViewModeChange}
              backgroundImage={backgroundImage}
              onBackgroundImageChange={handleBackgroundImageChange}
            />
          </FadeIn>
        </Suspense>
      );
    }

    if (currentCategory === 'sources') {
      return (
        <Suspense fallback={<PageLoader>加载源管理器...</PageLoader>}>
          <FadeIn>
            <LazySourceManager theme={theme} onSourcesChange={() => loadApps(currentCategory)} />
          </FadeIn>
        </Suspense>
      );
    }

    if (isDownloadManagerVisible) {
      return (
        <Suspense fallback={<PageLoader>加载下载管理器...</PageLoader>}>
          <FadeIn>
            <LazyDownloadManager 
              ref={downloadManagerRef} 
              theme={theme} 
              onDownloadRemoved={(appId) => {
                // 当下载任务被删除时，清除对应的下载状态
                setDownloadStates(prev => {
                  const newStates = { ...prev };
                  delete newStates[appId];
                  try {
                    localStorage.setItem('downloadStates', JSON.stringify(newStates));
                  } catch (error) {
                    console.error('保存下载状态失败:', error);
                  }
                  return newStates;
                });
              }}
            />
          </FadeIn>
        </Suspense>
      );
    }

    if (isMessagesVisible) {
      return (
        <FadeIn>
          <Messages theme={theme} />
        </FadeIn>
      );
    }

    if (selectedApp) {
      return (
        <Suspense fallback={<PageLoader>加载应用详情...</PageLoader>}>
          <FadeIn>
            <LazyAppDetails 
              app={selectedApp} 
              theme={theme} 
              onBack={handleBackToList}
              onDownload={handleDownload}
              getDownloadState={getDownloadState}
              handleDownloadControl={handleDownloadControl}
              getDownloadButtonText={getDownloadButtonText}
              formatFileSize={formatFileSize}
            />
          </FadeIn>
        </Suspense>
      );
    }

    // 应用列表页面
    if (contentLoading) {
      return <PageLoader>加载数据中...</PageLoader>;
    }

    if (loading) {
      return <FadeIn><div>{t('common.loading')}</div></FadeIn>;
    }

    if (filteredApps.length === 0 && searchTerm) {
      return <FadeIn><div>{t('common.noResults')}</div></FadeIn>;
    }

    if (filteredApps.length === 0) {
      return <FadeIn><div>{t('sourceManager.addSource')}</div></FadeIn>;
    }

    // 根据视图模式选择不同的渲染方式
    return (
      <FadeIn>
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </FadeIn>
    );
  }, [
    pageReady,
    contentLoading,
    currentCategory, 
    theme, 
    currentLanguage,
    viewMode,
    backgroundImage,
    isDownloadManagerVisible,
    isMessagesVisible,
    selectedApp, 
    loading, 
    filteredApps, 
    searchTerm,
    renderGridView,
    renderListView,
    handleBackToList,
    handleDownload,
    handleLanguageChange,
    handleThemeChange,
    handleViewModeChange,
    handleBackgroundImageChange,
    loadApps,
    t
  ]);

  // 使用useMemo缓存sidebar和header组件
  const sidebar = useMemo(() => (
    <Sidebar 
      currentCategory={currentCategory}
      onCategorySelect={handleCategorySelect}
      theme={theme}
      hasBackgroundImage={!!backgroundImage}
      backgroundOpacity={uiBackgroundOpacity}
    />
  ), [currentCategory, theme, backgroundImage, uiBackgroundOpacity, handleCategorySelect]);

  // 使用useMemo优化Header组件
  const memoizedHeader = useMemo(() => (
    <Header
      theme={theme}
      onSearch={handleSearch}
      onToggleDownloadManager={handleToggleDownloadManager}
        onToggleMessages={handleToggleMessages}
        isMessagesVisible={isMessagesVisible}
      isDownloadManagerVisible={isDownloadManagerVisible}
      hasBackgroundImage={!!backgroundImage}
      backgroundOpacity={uiBackgroundOpacity}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
    />
  ), [theme, handleSearch, handleToggleDownloadManager, handleToggleMessages, isDownloadManagerVisible, isMessagesVisible, backgroundImage, uiBackgroundOpacity, viewMode, handleViewModeChange]);

  const getCategoryTitle = useCallback(() => {
    if (selectedApp) {
      return t('app.description');
    }
    
    switch (currentCategory) {
      case 'dev-tools': return t('categories.all');
      case 'software': return t('categories.utilities');
      case 'games': return t('categories.games');
      case 'ai-models': return 'AI Models';
      case 'settings': return t('settings.title');
      case 'sources': return t('sourceManager.title');
      default: return isDownloadManagerVisible ? t('downloadManager.title') : '';
    }
  }, [currentCategory, isDownloadManagerVisible, selectedApp, t]);

  // 确保下载管理器在组件挂载时初始化
  useEffect(() => {
    // 组件挂载时，确保下载管理器引用已准备好
    const initDownloadManager = () => {
      if (!downloadManagerRef.current && isDownloadManagerVisible) {
        // 如果需要显示下载管理器，下一帧会创建它，确保引用可用
        setTimeout(() => {
          console.log(t('downloadManager.title'), !!downloadManagerRef.current);
        }, 100);
      }
    };
    
    initDownloadManager();
  }, [isDownloadManagerVisible, t]);

  // 监听下载进度
  useEffect(() => {
    let progressInterval;
    
    const checkDownloadProgress = async () => {
      const activeDownloads = Object.entries(downloadStates).filter(
        ([_, state]) => state.status === 'downloading' && state.taskId
      );
      
      for (const [appId, state] of activeDownloads) {
        try {
          const task = await invoke('get_download_progress', { taskId: state.taskId });
          if (task) {
            updateDownloadState(appId, {
              progress: Math.round(task.progress || 0),
              speed: task.speed || '0.0 B/s',
              totalSize: task.total_size || 0,
              downloadedSize: task.downloaded_size || 0
            });
            
            // 检查是否完成
            if (task.progress >= 100 || task.status === 'Completed') {
              updateDownloadState(appId, {
                status: 'completed',
                progress: 100,
                filePath: task.file_path
              });
              // 下载完成后自动检查应用安装状态
              if (task.file_path) {
                checkAppInstallStatus(appId, task.file_path);
              }
            } else if (task.status === 'Failed' || task.status === 'Error') {
              updateDownloadState(appId, {
                status: 'failed'
              });
            } else if (task.status === 'Paused') {
              updateDownloadState(appId, {
                status: 'paused'
              });
            }
          }
        } catch (error) {
          console.error(`获取下载进度失败 (${appId}):`, error);
          // 如果获取进度失败，可能下载已经完成或出错
          updateDownloadState(appId, { status: 'failed' });
        }
      }
    };
    
    // 如果有活跃的下载，启动进度检查
    const hasActiveDownloads = Object.values(downloadStates).some(
      state => state.status === 'downloading'
    );
    
    if (hasActiveDownloads) {
      progressInterval = setInterval(checkDownloadProgress, 1000); // 每秒检查一次
    }
    
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [downloadStates, updateDownloadState, checkAppInstallStatus]);

  // 点击外部区域关闭下载详情
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('[data-download-dropdown]')) {
        setShowDownloadDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  // 添加初始化时的CSS变量设置
  useEffect(() => {
    // 设置初始CSS变量值
    document.documentElement.style.setProperty('--app-bg-opacity', backgroundOpacity);
    
    // 使用动画帧确保在UI渲染前更新
    requestAnimationFrame(() => {
      setUiBackgroundOpacity(backgroundOpacity);
    });
  }, []);

  // 优化渲染方法
  const memoizedRenderContent = useMemo(() => renderContent(), [
    pageReady,
    contentLoading,
    currentCategory, 
    theme, 
    currentLanguage,
    viewMode,
    backgroundImage,
    isDownloadManagerVisible, 
    selectedApp, 
    loading, 
    filteredApps, 
    searchTerm,
    renderGridView,
    renderListView,
    handleBackToList,
    handleDownload,
    handleLanguageChange,
    handleThemeChange,
    handleViewModeChange,
    handleBackgroundImageChange,
    loadApps,
    t
  ]);

  // 在渲染中使用优化后的内容
  return (
    <AppContainer 
      theme={theme} 
      backgroundImage={backgroundImage} 
      backgroundOpacity={uiBackgroundOpacity}
      style={{ '--app-bg-opacity': uiBackgroundOpacity }}
      data-app-container="true"
    >
      <StagewiseToolbar 
        config={{
          plugins: [ReactPlugin]
        }}
      />
      {sidebar}
      <MainContent>
        {memoizedHeader}
        <ContentArea>
          <h2>{getCategoryTitle()}</h2>
          {memoizedRenderContent}
        </ContentArea>
      </MainContent>
      
      {/* 全局下载管理器组件，处理后台下载任务 */}
      <TauriDownloader 
        onDownloadStart={(download) => console.log(t('downloadManager.starting'), download.name)}
        onDownloadComplete={(download) => {
          console.log(t('downloadManager.completed'), download.name);
          // 下载完成后检查应用安装状态
          if (download.appId && download.filePath) {
            checkAppInstallStatus(download.appId, download.filePath);
          }
        }}
        onDownloadError={(download, error) => console.error(t('downloadManager.failed'), download.name, error)}
      />
      
      {/* 通知系统 */}
      <NotificationSystem theme={theme} />
      
      {/* 确认对话框容器 */}
      <ConfirmDialogContainer theme={theme} />
      
      {/* 输入对话框容器 */}
      <PromptDialogContainer theme={theme} />
    </AppContainer>
  );
};

export default App;
