import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useTranslationContext } from './components/TranslationProvider';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Settings from './components/Settings';
import SourceManager from './components/SourceManager';
import SimpleDownloadManager from './components/SimpleDownloadManager';
import AppDetails from './components/AppDetails';
import { TauriDownloader, TauriDownloaderUtil } from './components/TauriDownloader';
import { fetchAppsFromSources, fetchAppsByCategory } from './services/sourceService';

const AppContainer = styled.div`
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
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  background-color: #0066CC;
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

const LazySimpleDownloadManager = lazy(() => {
  return new Promise(resolve => 
    setTimeout(() => resolve(import('./components/SimpleDownloadManager')), 100)
  );
});

const LazyAppDetails = lazy(() => {
  return new Promise(resolve => 
    setTimeout(() => resolve(import('./components/AppDetails')), 100)
  );
});

const LazyDownloadPage = lazy(() => {
  return new Promise(resolve => 
    setTimeout(() => resolve(import('./components/DownloadPage')), 100)
  );
});

const App = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useTranslationContext();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [backgroundImage, setBackgroundImage] = useState(() => {
    // 首先尝试获取常规背景图片
    const savedBackground = localStorage.getItem('backgroundImage');
    // 然后检查是否有自定义背景图片
    const customBackground = localStorage.getItem('customBackgroundImage');
    
    // 如果有自定义背景，优先使用自定义背景
    if (customBackground) {
      return customBackground;
    }
    
    // 否则返回常规背景或空字符串
    return savedBackground || '';
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
  const [selectedApp, setSelectedApp] = useState(null);
  const downloadManagerRef = useRef(null);
  
  // 使用防抖，避免频繁更新localStorage
  const debounceTimeoutRef = useRef(null);
  
  // 添加Toast通知状态
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: ''
  });
  
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
    } catch (error) {
      console.error('加载应用失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    // 如果下载管理器当前不可见，则显示它并切换到downloads分类
    if (!isDownloadManagerVisible) {
      setCurrentCategory('downloads');
      setIsDownloadManagerVisible(true);
    } else {
      // 如果当前已在downloads分类，则隐藏下载管理器并返回到之前的分类
      if (currentCategory === 'downloads') {
        // 返回到默认分类或之前的分类
        setCurrentCategory('dev-tools');
      }
      setIsDownloadManagerVisible(false);
    }
  }, [isDownloadManagerVisible, currentCategory]);

  // 处理应用下载
  const handleDownload = (app) => {
    try {
      // 显示通知，告知用户下载开始
      setToast({
        show: true,
        message: t('common.downloadStarting'),
        type: 'info'
      });
      
      // 切换到下载管理页面
      setCurrentCategory('downloads');
      
      // 生成唯一ID用于跟踪此次下载
      const downloadId = Date.now();
      
      // 确保文件名包含正确的扩展名
      let fileName = app.name;
      // 如果应用名称没有扩展名，根据下载URL或平台添加扩展名
      if (fileName && !fileName.includes('.')) {
        const downloadUrl = app.downloadUrl || '';
        if (downloadUrl.includes('.exe') || downloadUrl.toLowerCase().includes('windows')) {
          fileName += '.exe';
        } else if (downloadUrl.includes('.dmg') || downloadUrl.toLowerCase().includes('macos')) {
          fileName += '.dmg';
        } else if (downloadUrl.includes('.apk')) {
          fileName += '.apk';
        } else if (downloadUrl.includes('.zip')) {
          fileName += '.zip';
        } else if (downloadUrl.includes('.msi')) {
          fileName += '.msi';
      } else {
          // 默认为可执行文件
          fileName += '.exe';
        }
      }
      
      // 将下载信息存储到sessionStorage中，以便下载页面组件获取并处理
      sessionStorage.setItem('pendingDownload', JSON.stringify({
        downloadUrl: app.downloadUrl,
        fileName: fileName, // 使用处理后的文件名
        appInfo: app
      }));
        
      // 3秒后淡出通知
        setTimeout(() => {
        setToast({
          show: false,
          message: '',
          type: ''
        });
        }, 3000);
    } catch (error) {
      console.error('下载失败:', error);
      setToast({
        show: true,
        message: t('common.downloadFailed'),
        type: 'error'
      });
    }
  };

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
          // 检查是否是默认背景之一
          const isDefaultBackground = [
            'https://cdn.pixabay.com/photo/2020/10/27/08/00/mountains-5689938_1280.png',
            'https://cdn.pixabay.com/photo/2012/08/27/14/19/mountains-55067_1280.png',
            'https://media.istockphoto.com/id/1145054673/zh/%E5%90%91%E9%87%8F/%E6%B5%B7%E7%81%98.jpg'
          ].includes(imageUrl);
          
          if (imageUrl === '') {
            // 如果是空值（无背景）
            localStorage.removeItem('customBackgroundImage');
            localStorage.removeItem('backgroundImage');
          } else if (isDefaultBackground) {
            // 如果是默认背景，则只保存到backgroundImage
            localStorage.removeItem('customBackgroundImage');
            localStorage.setItem('backgroundImage', imageUrl);
          } else {
            // 否则假定为自定义背景，保存到customBackgroundImage
            localStorage.setItem('customBackgroundImage', imageUrl);
            localStorage.setItem('backgroundImage', ''); // 清空常规背景
          }
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
              <DownloadButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(app);
                }}
              >
                {t('app.download')}
              </DownloadButton>
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
                <DownloadButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(app);
                  }}
                >
                  {t('app.download')}
                </DownloadButton>
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
    
    if (currentCategory === 'downloads') {
      return (
        <Suspense fallback={<PageLoader>加载下载页面...</PageLoader>}>
          <FadeIn>
            <LazyDownloadPage theme={theme} />
          </FadeIn>
        </Suspense>
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
      hasBackgroundImage={!!backgroundImage}
      backgroundOpacity={uiBackgroundOpacity}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
    />
  ), [theme, handleSearch, backgroundImage, uiBackgroundOpacity, viewMode, handleViewModeChange]);

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
      case 'downloads': return t('downloadManager.title');
      default: return '';
    }
  }, [currentCategory, selectedApp, t]);

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
    >
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
        onDownloadComplete={(download) => console.log(t('downloadManager.completed'), download.name)}
        onDownloadError={(download, error) => console.error(t('downloadManager.failed'), download.name, error)}
      />
      
      {/* Toast通知组件 */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: toast.type === 'error' ? '#d32f2f' : 
                             toast.type === 'success' ? '#388e3c' : 
                             toast.type === 'warning' ? '#f57c00' : '#0066CC',
            color: 'white',
            borderRadius: '4px',
            zIndex: '9999',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            transition: 'opacity 0.3s ease',
          }}
        >
          {toast.message}
        </div>
      )}
    </AppContainer>
  );
};

export default App;
