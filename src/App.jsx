import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  background-image: ${props => props.backgroundImage ? `url(${props.backgroundImage})` : 'none'};
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${props => props.backgroundImage 
      ? (props.theme === 'dark' ? `rgba(29, 29, 31, ${props.backgroundOpacity || 0.8})` : `rgba(245, 245, 247, ${props.backgroundOpacity || 0.8})`) 
      : 'transparent'};
    z-index: 0;
    pointer-events: none;
    will-change: opacity;
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

  const loadApps = useCallback(async (category) => {
    setLoading(true);
    try {
      let appsList = [];
      
      if (category === 'dev-tools') {
        appsList = await fetchAppsFromSources();
      } else {
        appsList = await fetchAppsByCategory(category);
      }
      
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

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredApps(apps);
      return;
    }

    const searchResults = apps.filter(app => {
      const searchString = `${app.name} ${app.description} ${app.developer || ''}`.toLowerCase();
      return searchString.includes(term.toLowerCase());
    });

    setFilteredApps(searchResults);
  }, [apps]);

  const handleAppClick = (app) => {
    setSelectedApp(app);
  };

  const handleBackToList = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const handleCategorySelect = useCallback((category) => {
    setCurrentCategory(category);
    setSearchTerm('');
    setIsDownloadManagerVisible(false);
    setSelectedApp(null);
  }, []);

  // 处理主题切换 - 优化为useCallback
  const handleThemeChange = useCallback((newTheme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
    }
  }, [theme]);

  const handleToggleDownloadManager = useCallback(() => {
    setIsDownloadManagerVisible(!isDownloadManagerVisible);
  }, [isDownloadManagerVisible]);

  const handleDownload = (app) => {
    try {
      // Show immediate feedback to the user
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.padding = '10px 20px';
      toast.style.backgroundColor = '#0066CC';
      toast.style.color = 'white';
      toast.style.borderRadius = '4px';
      toast.style.zIndex = '9999';
      toast.style.transition = 'opacity 0.5s ease';
      toast.textContent = `${t('downloadManager.starting')}: ${app.name}`;
      
      document.body.appendChild(toast);
      
      // First try using the download manager reference
      if (downloadManagerRef.current) {
        console.log(t('downloadManager.starting'));
        downloadManagerRef.current.startDownload({
          name: app.name,
          downloadUrl: app.downloadUrl
        });
      } else {
        // If reference is not available, use TauriDownloaderUtil directly
        console.log(t('downloadManager.downloading'));
        TauriDownloaderUtil.downloadFile(app.downloadUrl, app.name);
      }
      
      // 3 seconds later, update the toast to say downloading is in progress
      setTimeout(() => {
        toast.textContent = `${t('downloadManager.downloading')}: ${app.name}`;
        
        // 3 more seconds later, make the toast disappear
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 500);
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error(t('downloadManager.failed'), error);
      alert(`${t('downloadManager.failed')}: ${app.name} - ${error.message || t('errors.unknownError')}`);
    }
  };

  // 处理背景图片变更 - 优化为useCallback
  const handleBackgroundImageChange = useCallback((imageUrl, opacity) => {
    // 如果图片URL变化才设置
    if (imageUrl !== backgroundImage) {
      setBackgroundImage(imageUrl);
    }
    
    // 如果提供了透明度值，并且与当前值不同，才更新透明度
    if (opacity !== undefined && Math.abs(opacity - backgroundOpacity) > 0.01) {
      setBackgroundOpacity(opacity);
    }
  }, [backgroundImage, backgroundOpacity]);

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

  // 使用useMemo缓存设置组件
  const settingsComponent = useMemo(() => {
    if (currentCategory === 'settings') {
      return (
        <Settings 
          theme={theme} 
          language={currentLanguage}
          viewMode={viewMode}
          onThemeChange={handleThemeChange}
          onLanguageChange={handleLanguageChange}
          onViewModeChange={handleViewModeChange}
          backgroundImage={backgroundImage}
          onBackgroundImageChange={handleBackgroundImageChange}
        />
      );
    }
    return null;
  }, [currentCategory, theme, currentLanguage, viewMode, backgroundImage, handleThemeChange, handleLanguageChange, handleViewModeChange, handleBackgroundImageChange]);

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

  // 使用useMemo缓存内容区域
  const renderContent = useCallback(() => {
    if (currentCategory === 'settings') {
      return settingsComponent;
    }

    if (currentCategory === 'sources') {
      return <SourceManager theme={theme} onSourcesChange={() => loadApps(currentCategory)} />;
    }

    if (isDownloadManagerVisible) {
      return (
        <div className="download-log-container">
          <SimpleDownloadManager ref={downloadManagerRef} theme={theme} />
        </div>
      );
    }

    if (selectedApp) {
      return (
        <AppDetails 
          app={selectedApp} 
          theme={theme} 
          onBack={handleBackToList}
          onDownload={handleDownload}
        />
      );
    }

    if (loading) {
      return <div>{t('common.loading')}</div>;
    }

    if (filteredApps.length === 0 && searchTerm) {
      return <div>{t('common.noResults')}</div>;
    }

    if (filteredApps.length === 0) {
      return <div>{t('sourceManager.addSource')}</div>;
    }

    // 根据视图模式选择不同的渲染方式
    return viewMode === 'grid' ? renderGridView() : renderListView();
  }, [
    currentCategory, 
    settingsComponent, 
    theme, 
    isDownloadManagerVisible, 
    selectedApp, 
    loading, 
    filteredApps, 
    searchTerm,
    viewMode,
    renderGridView,
    renderListView,
    handleBackToList,
    handleDownload,
    t
  ]);

  // 使用useMemo缓存sidebar和header组件
  const sidebar = useMemo(() => (
    <Sidebar 
      currentCategory={currentCategory}
      onCategorySelect={handleCategorySelect}
      theme={theme}
      hasBackgroundImage={!!backgroundImage}
      backgroundOpacity={backgroundOpacity}
    />
  ), [currentCategory, theme, backgroundImage, backgroundOpacity, handleCategorySelect]);

  // 使用useMemo优化Header组件
  const memoizedHeader = useMemo(() => (
    <Header
      theme={theme}
      onSearch={handleSearch}
      onToggleDownloadManager={handleToggleDownloadManager}
      isDownloadManagerVisible={isDownloadManagerVisible}
      hasBackgroundImage={!!backgroundImage}
      backgroundOpacity={backgroundOpacity}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
    />
  ), [theme, handleSearch, handleToggleDownloadManager, isDownloadManagerVisible, backgroundImage, backgroundOpacity, viewMode, handleViewModeChange]);

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

  return (
    <AppContainer theme={theme} backgroundImage={backgroundImage} backgroundOpacity={backgroundOpacity}>
      {sidebar}
      <MainContent>
        {memoizedHeader}
        <ContentArea>
          <h2>{getCategoryTitle()}</h2>
          {renderContent()}
        </ContentArea>
      </MainContent>
      
      {/* 全局下载管理器组件，处理后台下载任务 */}
      <TauriDownloader 
        onDownloadStart={(download) => console.log(t('downloadManager.starting'), download.name)}
        onDownloadComplete={(download) => console.log(t('downloadManager.completed'), download.name)}
        onDownloadError={(download, error) => console.error(t('downloadManager.failed'), download.name, error)}
      />
    </AppContainer>
  );
};

export default App;
