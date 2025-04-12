import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Settings from './components/Settings';
import SourceManager from './components/SourceManager';
import SimpleDownloadManager from './components/SimpleDownloadManager';
import { TauriDownloader } from './components/TauriDownloader';
import { fetchAppsFromSources, fetchAppsByCategory } from './services/sourceService';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

const App = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [currentCategory, setCurrentCategory] = useState('dev-tools');
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadManagerVisible, setIsDownloadManagerVisible] = useState(false);
  const downloadManagerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'appSources' || e.key === 'blobSources') {
        loadApps(currentCategory);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentCategory]);

  const loadApps = async (category) => {
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
  };

  useEffect(() => {
    if (['dev-tools', 'software', 'games', 'ai-models'].includes(currentCategory)) {
      loadApps(currentCategory);
    }
  }, [currentCategory]);

  const handleSearch = (term) => {
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
  };

  const handleCategorySelect = (category) => {
    setCurrentCategory(category);
    setSearchTerm('');
    setIsDownloadManagerVisible(false);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleToggleDownloadManager = () => {
    setIsDownloadManagerVisible(!isDownloadManagerVisible);
  };

  const handleDownload = (app) => {
    // 在下载前显示下载管理器
    setIsDownloadManagerVisible(true);
    
    // 延迟一下，确保下载管理器已经渲染并且引用可用
    setTimeout(() => {
      if (downloadManagerRef.current) {
        downloadManagerRef.current.startDownload({
          name: app.name,
          downloadUrl: app.downloadUrl
        });
      } else {
        console.error('下载管理器引用不可用');
        alert(`无法启动下载: 下载管理器未准备好`);
      }
    }, 100); // 短暂延迟确保下载管理器已渲染
  };

  const getCategoryTitle = () => {
    switch (currentCategory) {
      case 'dev-tools': return '所有应用';
      case 'software': return '软件';
      case 'games': return '游戏';
      case 'ai-models': return 'AI大模型';
      case 'settings': return '设置';
      case 'sources': return '软件源';
      default: return isDownloadManagerVisible ? '下载管理' : '';
    }
  };

  const renderContent = () => {
    if (currentCategory === 'settings') {
      return <Settings theme={theme} onThemeChange={handleThemeChange} />;
    }

    if (currentCategory === 'sources') {
      return <SourceManager theme={theme} onSourcesChange={() => loadApps(currentCategory)} />;
    }

    if (isDownloadManagerVisible) {
      return <SimpleDownloadManager ref={downloadManagerRef} theme={theme} />;
    }

    if (loading) {
      return <div>加载中...</div>;
    }

    if (filteredApps.length === 0 && searchTerm) {
      return <div>没有找到匹配的应用</div>;
    }

    if (filteredApps.length === 0) {
      return <div>没有找到应用，请添加软件源</div>;
    }

    return (
      <AppGrid>
        {filteredApps.map(app => (
          <AppCard key={app.id} theme={theme}>
            <AppHeader>
              <AppIcon bgColor={app.iconBgColor}>
                <img src={app.icon} alt={app.name} />
              </AppIcon>
              <AppInfo>
                <AppName>{app.name}</AppName>
                <AppDeveloper theme={theme}>{app.developer || '未知开发者'}</AppDeveloper>
              </AppInfo>
            </AppHeader>
            <AppDescription theme={theme}>{app.description}</AppDescription>
            <AppFooter>
              <AppPrice theme={theme}>{app.price === 0 ? '免费' : `￥${app.price}`}</AppPrice>
              <DownloadButton onClick={() => handleDownload(app)}>
                下载
              </DownloadButton>
            </AppFooter>
          </AppCard>
        ))}
      </AppGrid>
    );
  };

  return (
    <AppContainer theme={theme}>
      <Sidebar 
        currentCategory={currentCategory}
        onCategorySelect={handleCategorySelect}
        theme={theme}
      />
      <MainContent>
        <Header 
          theme={theme} 
          onSearch={handleSearch}
          onToggleDownloadManager={handleToggleDownloadManager}
          isDownloadManagerVisible={isDownloadManagerVisible}
        />
        <ContentArea>
          <h2>{getCategoryTitle()}</h2>
          {renderContent()}
        </ContentArea>
      </MainContent>
      
      {/* 全局下载管理器组件，处理后台下载任务 */}
      <TauriDownloader 
        onDownloadStart={(download) => console.log('下载开始:', download.name)}
        onDownloadComplete={(download) => console.log('下载完成:', download.name)}
        onDownloadError={(download, error) => console.error('下载错误:', download.name, error)}
      />
    </AppContainer>
  );
};

export default App;
