import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SourceInfoContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
`;

const SourceTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SourceMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 16px;
`;

const MetaItem = styled.div`
  flex: 1;
  min-width: 150px;
`;

const MetaLabel = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  margin-bottom: 4px;
`;

const MetaValue = styled.div`
  font-size: 15px;
  font-weight: 500;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#0a84ff' : '#0066cc'};
  cursor: pointer;
  padding: 0;
  font-size: 14px;
`;

const ItemsContainer = styled.div`
  margin-top: 10px;
  max-height: ${props => props.expanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

const ItemsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-top: 12px;
`;

const AppItem = styled.div`
  padding: 10px;
  border-radius: 8px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AppIcon = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
`;

const AppInfo = styled.div`
  flex: 1;
`;

const AppName = styled.div`
  font-weight: 500;
  margin-bottom: 2px;
`;

const AppDeveloper = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin: 10px 0;
  padding: 8px 12px;
  background-color: ${props => props.theme === 'dark' ? '#32252a' : '#fff2f2'};
  border-radius: 6px;
  font-size: 14px;
`;

const SourceDescription = styled.div`
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 12px;
  margin-left: 8px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#e0e0e0'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

// SourceInfo 组件
const SourceInfo = ({ source, theme }) => {
  const [showItems, setShowItems] = useState(false);
  const [sourceData, setSourceData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    try {
      if (source.jsonData) {
        const data = JSON.parse(source.jsonData);
        setSourceData(data);
        setError(null);
      }
    } catch (err) {
      console.error('解析源数据失败:', err);
      setError(`无法解析源数据: ${err.message}`);
    }
  }, [source]);
  
  if (!sourceData) {
    return (
      <SourceInfoContainer theme={theme}>
        <SourceTitle>{source.name}</SourceTitle>
        {error && (
          <ErrorMessage theme={theme}>{error}</ErrorMessage>
        )}
        <div>正在加载源数据...</div>
      </SourceInfoContainer>
    );
  }
  
  const items = Array.isArray(sourceData.items) ? sourceData.items : [];
  
  return (
    <SourceInfoContainer theme={theme}>
      <SourceTitle>
        {sourceData.name || source.name}
        {sourceData.version && (
          <Badge theme={theme}>v{sourceData.version}</Badge>
        )}
        <ToggleButton theme={theme} onClick={() => setShowItems(!showItems)}>
          {showItems ? '收起项目列表' : '查看项目列表'}
        </ToggleButton>
      </SourceTitle>
      
      {sourceData.description && (
        <SourceDescription theme={theme}>{sourceData.description}</SourceDescription>
      )}
      
      <SourceMeta>
        <MetaItem>
          <MetaLabel theme={theme}>URL</MetaLabel>
          <MetaValue>{sourceData.url || source.url}</MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel theme={theme}>项目数量</MetaLabel>
          <MetaValue>{items.length}</MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel theme={theme}>状态</MetaLabel>
          <MetaValue>{source.enabled ? '已启用' : '已禁用'}</MetaValue>
        </MetaItem>
      </SourceMeta>
      
      <ItemsContainer expanded={showItems}>
        {items.length > 0 ? (
          <ItemsList>
            {items.map((item, index) => (
              <AppItem key={index} theme={theme}>
                <AppIcon src={item.iconUrl || 'https://via.placeholder.com/40'} alt={item.name} />
                <AppInfo>
                  <AppName>{item.name}</AppName>
                  <AppDeveloper theme={theme}>
                    {item.author || '未知开发者'} {item.version && `· v${item.version}`}
                  </AppDeveloper>
                </AppInfo>
              </AppItem>
            ))}
          </ItemsList>
        ) : (
          <div>此源没有可用项目</div>
        )}
      </ItemsContainer>
    </SourceInfoContainer>
  );
};

export default SourceInfo; 