import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Header from './Header';
import FeaturedApps from './FeaturedApps';
import AppGrid from './AppGrid';
import Settings from './Settings';
import { featuredApps, topApps, newApps, workApps, gameApps, aiApps } from '../data/mockApps';

const StoreContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  max-width: 1600px; 
  margin: 0 auto; /* 水平居中窗口 */
  width: 100%;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : 'white'};
  transition: background-color 0.3s ease;
`;

const ContentArea = styled.div`
  padding: 12px 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const AppStore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('dev-tools');
  const [theme, setTheme] = useState(() => {
    // 尝试从本地存储中获取主题设置
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [language, setLanguage] = useState(() => {
    // 尝试从本地存储中获取语言设置
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'zh';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // 尝试从本地存储中获取侧边栏折叠状态
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  // 窗口大小设置相关状态
  const [windowSize, setWindowSize] = useState(() => {
    const savedSize = localStorage.getItem('windowSize');
    return savedSize ? JSON.parse(savedSize) : { width: 1280, height: 720 };
  });
  
  // 新增设置状态
  const [gridSize, setGridSize] = useState(() => {
    const savedSetting = localStorage.getItem('gridSize');
    return savedSetting ? parseInt(savedSetting) : 4;
  });
  const [animation, setAnimation] = useState(() => {
    const savedSetting = localStorage.getItem('animation');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [downloadLocation, setDownloadLocation] = useState(() => {
    const savedSetting = localStorage.getItem('downloadLocation');
    return savedSetting || '/Downloads';
  });
  const [appDisplayMode, setAppDisplayMode] = useState(() => {
    const savedSetting = localStorage.getItem('appDisplayMode');
    return savedSetting || 'grid';
  });
  const [autoUpdate, setAutoUpdate] = useState(() => {
    const savedSetting = localStorage.getItem('autoUpdate');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [wifiOnlyUpdate, setWifiOnlyUpdate] = useState(() => {
    const savedSetting = localStorage.getItem('wifiOnlyUpdate');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [preloadPopularApps, setPreloadPopularApps] = useState(() => {
    const savedSetting = localStorage.getItem('preloadPopularApps');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [hardwareAcceleration, setHardwareAcceleration] = useState(() => {
    const savedSetting = localStorage.getItem('hardwareAcceleration');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [sendUsageStats, setSendUsageStats] = useState(() => {
    const savedSetting = localStorage.getItem('sendUsageStats');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [allowThirdPartyTracking, setAllowThirdPartyTracking] = useState(() => {
    const savedSetting = localStorage.getItem('allowThirdPartyTracking');
    return savedSetting ? JSON.parse(savedSetting) : false;
  });

  // 当设置更改时保存到本地存储
  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    localStorage.setItem('windowSize', JSON.stringify(windowSize));
    
    // 保存新增设置
    localStorage.setItem('gridSize', gridSize);
    localStorage.setItem('animation', JSON.stringify(animation));
    localStorage.setItem('downloadLocation', downloadLocation);
    localStorage.setItem('appDisplayMode', appDisplayMode);
    localStorage.setItem('autoUpdate', JSON.stringify(autoUpdate));
    localStorage.setItem('wifiOnlyUpdate', JSON.stringify(wifiOnlyUpdate));
    localStorage.setItem('preloadPopularApps', JSON.stringify(preloadPopularApps));
    localStorage.setItem('hardwareAcceleration', JSON.stringify(hardwareAcceleration));
    localStorage.setItem('sendUsageStats', JSON.stringify(sendUsageStats));
    localStorage.setItem('allowThirdPartyTracking', JSON.stringify(allowThirdPartyTracking));
  }, [
    theme, language, sidebarCollapsed, windowSize, gridSize, animation, 
    downloadLocation, appDisplayMode, autoUpdate, wifiOnlyUpdate,
    preloadPopularApps, hardwareAcceleration, sendUsageStats, allowThirdPartyTracking
  ]);

  // 应用启动时应用窗口大小设置
  useEffect(() => {
    // 检查是否在Tauri环境中运行
    if (window.__TAURI__) {
      try {
        const { appWindow } = window.__TAURI__.window;
        appWindow.setSize({ 
          width: windowSize.width, 
          height: windowSize.height 
        });
        appWindow.center();
      } catch (e) {
        console.error('应用窗口大小设置失败:', e);
      }
    }
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCategorySelect = (category) => {
    setCurrentCategory(category);
  };
  
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // 如果设置为跟随系统，则获取系统主题
    if (newTheme === 'system') {
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'dark' : 'light');
    }
  };
  
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };
  
  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // 窗口大小设置处理函数
  const handleWindowSizeChange = (size) => {
    setWindowSize(size);
    
    // 如果应用已集成Tauri，实时应用窗口大小
    if (window.__TAURI__) {
      try {
        const { appWindow } = window.__TAURI__.window;
        appWindow.setSize({ width: size.width, height: size.height });
        appWindow.center();
      } catch (e) {
        console.error('调整窗口大小失败:', e);
      }
    }
  };

  // 新增设置的处理函数
  const handleGridSizeChange = (value) => {
    setGridSize(value);
  };
  
  const handleAnimationChange = (value) => {
    setAnimation(value);
  };
  
  const handleDownloadLocationChange = (value) => {
    setDownloadLocation(value);
  };
  
  const handleAppDisplayModeChange = (value) => {
    setAppDisplayMode(value);
  };
  
  const handleAutoUpdateChange = (value) => {
    setAutoUpdate(value);
  };
  
  const handleWifiOnlyUpdateChange = (value) => {
    setWifiOnlyUpdate(value);
  };
  
  const handlePreloadPopularAppsChange = (value) => {
    setPreloadPopularApps(value);
  };
  
  const handleHardwareAccelerationChange = (value) => {
    setHardwareAcceleration(value);
  };
  
  const handleSendUsageStatsChange = (value) => {
    setSendUsageStats(value);
  };
  
  const handleAllowThirdPartyTrackingChange = (value) => {
    setAllowThirdPartyTracking(value);
  };
  
  const handleClearCache = () => {
    // 这里可以实现实际的缓存清理功能
    console.log('清除缓存');
    // 如果使用Tauri，可以调用本地API清除缓存
  };

  // 根据搜索词过滤应用
  const filterApps = (apps) => {
    if (!searchTerm) return apps;
    
    return apps.filter(app => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.developer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 根据所选类别渲染内容
  const renderCategoryContent = () => {
    switch (currentCategory) {
      case 'dev-tools':
        return (
          <>
            <FeaturedApps featuredApps={filterApps(featuredApps)} />
            <AppGrid 
              title="推荐应用" 
              apps={filterApps([...topApps, ...newApps])} 
            />
          </>
        );
      case 'software':
        return (
          <>
            <AppGrid 
              title="软件" 
              apps={filterApps([...topApps, ...workApps].filter(app => 
                app.name.includes('Office') || 
                app.name.includes('Notion') || 
                app.name.includes('Slack') ||
                app.name.includes('Trello') ||
                app.name.includes('Asana')
              ))} 
            />
          </>
        );
      case 'games':
        return (
          <>
            <AppGrid title="游戏" apps={filterApps(gameApps)} />
          </>
        );
      case 'ai-models':
        return (
          <>
            <AppGrid title="AI大模型" apps={filterApps(aiApps)} />
          </>
        );
      case 'settings':
        return (
          <Settings 
            theme={theme} 
            language={language} 
            onThemeChange={handleThemeChange}
            onLanguageChange={handleLanguageChange}
            windowSize={windowSize}
            onWindowSizeChange={handleWindowSizeChange}
            gridSize={gridSize}
            animation={animation}
            downloadLocation={downloadLocation}
            appDisplayMode={appDisplayMode}
            autoUpdate={autoUpdate}
            wifiOnlyUpdate={wifiOnlyUpdate}
            preloadPopularApps={preloadPopularApps}
            hardwareAcceleration={hardwareAcceleration}
            sendUsageStats={sendUsageStats}
            allowThirdPartyTracking={allowThirdPartyTracking}
            onGridSizeChange={handleGridSizeChange}
            onAnimationChange={handleAnimationChange}
            onDownloadLocationChange={handleDownloadLocationChange}
            onAppDisplayModeChange={handleAppDisplayModeChange}
            onAutoUpdateChange={handleAutoUpdateChange}
            onWifiOnlyUpdateChange={handleWifiOnlyUpdateChange}
            onPreloadPopularAppsChange={handlePreloadPopularAppsChange}
            onHardwareAccelerationChange={handleHardwareAccelerationChange}
            onSendUsageStatsChange={handleSendUsageStatsChange}
            onAllowThirdPartyTrackingChange={handleAllowThirdPartyTrackingChange}
            onClearCache={handleClearCache}
          />
        );
      case 'others':
      default:
        return (
          <>
            <AppGrid 
              title="其他应用" 
              apps={filterApps([...newApps, ...topApps].filter(app => 
                app.name.includes('Spotify') ||
                app.name.includes('CleanMyMac') ||
                app.name.includes('Alfred') ||
                app.name.includes('Obsidian')
              ))} 
            />
          </>
        );
    }
  };

  return (
    <StoreContainer theme={theme}>
      <Sidebar 
        onCategorySelect={handleCategorySelect} 
        currentCategory={currentCategory}
        onToggleCollapse={handleSidebarToggle}
        defaultCollapsed={sidebarCollapsed}
        theme={theme}
      />
      <MainContent theme={theme}>
        <Header onSearch={handleSearch} theme={theme} />
        <ContentArea>
          {renderCategoryContent()}
        </ContentArea>
      </MainContent>
    </StoreContainer>
  );
};

export default AppStore; 