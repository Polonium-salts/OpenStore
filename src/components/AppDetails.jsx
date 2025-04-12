import React from 'react';
import styled from 'styled-components';

const DetailsContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  width: 100%;
`;

const Header = styled.div`
  padding: 24px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const AppIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-right: 24px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AppInfo = styled.div`
  flex: 1;
`;

const AppName = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const AppMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
`;

const MetaItem = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 6px;
  }
`;

const AppDeveloper = styled.div`
  font-size: 16px;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
`;

const ContentSection = styled.div`
  padding: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const Description = styled.div`
  font-size: 16px;
  line-height: 1.6;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#333'};
  margin-bottom: 24px;
`;

const ScreenshotSection = styled.div`
  margin-top: 24px;
  overflow: hidden;
`;

const Screenshot = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  
  img {
    width: 100%;
    max-height: 400px;
    object-fit: contain;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const Price = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const DownloadButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  background-color: #0066CC;
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
  background-color: ${props => {
    switch (props.category) {
      case 'software': return '#0066CC';
      case 'games': return '#34C759';
      case 'ai-models': return '#AF52DE';
      default: return '#999';
    }
  }};
  color: white;
`;

// 工具函数：获取分类中文名
const getCategoryName = (category) => {
  switch (category) {
    case 'software': return '软件';
    case 'games': return '游戏';
    case 'ai-models': return 'AI模型';
    default: return '其他';
  }
};

const BackButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme === 'dark' ? '#0066CC' : '#0066CC'};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? 'rgba(0, 102, 204, 0.1)' : 'rgba(0, 102, 204, 0.1)'};
  }
  
  svg {
    margin-right: 8px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 16px;
`;

const AppDetails = ({ app, theme, onBack, onDownload }) => {
  if (!app) {
    return (
      <DetailsContainer theme={theme}>
        <ContentSection>
          <SectionTitle theme={theme}>没有选中应用</SectionTitle>
          <BackButton onClick={onBack} theme={theme}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            返回列表
          </BackButton>
        </ContentSection>
      </DetailsContainer>
    );
  }

  return (
    <DetailsContainer theme={theme}>
      <PageHeader>
        <BackButton onClick={onBack} theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回列表
        </BackButton>
      </PageHeader>
      
      <Header theme={theme}>
        <AppIcon theme={theme}>
          <img src={app.icon} alt={app.name} onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/80?text=' + encodeURIComponent(app.name.charAt(0));
          }} />
        </AppIcon>
        <AppInfo>
          <AppName theme={theme}>{app.name}</AppName>
          <AppDeveloper theme={theme}>{app.developer || '未知开发者'}</AppDeveloper>
          <AppMeta>
            <MetaItem theme={theme}>
              <Badge category={app.category}>{getCategoryName(app.category)}</Badge>
            </MetaItem>
            {app.version && (
              <MetaItem theme={theme}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                  <line x1="16" y1="8" x2="2" y2="22"></line>
                  <line x1="17.5" y1="15" x2="9" y2="15"></line>
                </svg>
                版本 {app.version}
              </MetaItem>
            )}
          </AppMeta>
        </AppInfo>
      </Header>
      
      <ContentSection>
        <SectionTitle theme={theme}>应用介绍</SectionTitle>
        <Description theme={theme}>{app.description || '暂无介绍'}</Description>
        
        {app.screenshot && (
          <ScreenshotSection>
            <SectionTitle theme={theme}>应用截图</SectionTitle>
            <Screenshot theme={theme}>
              <img 
                src={app.screenshot} 
                alt={`${app.name} 截图`} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </Screenshot>
          </ScreenshotSection>
        )}
      </ContentSection>
      
      <ActionBar theme={theme}>
        <Price theme={theme}>
          {app.price === 0 ? '免费' : `¥${app.price}`}
        </Price>
        <div>
          <DownloadButton onClick={() => onDownload(app)}>
            下载
          </DownloadButton>
        </div>
      </ActionBar>
    </DetailsContainer>
  );
};

export default AppDetails; 