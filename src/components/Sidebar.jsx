import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

// 提取共用的透明度计算函数
const getBackgroundColor = (props, defaultDark, defaultLight) => {
  if (props.hasBackgroundImage) {
    const opacity = props.backgroundOpacity || 0.8;
    return props.theme === 'dark' 
      ? `rgba(42, 42, 45, ${opacity})` 
      : `rgba(245, 245, 247, ${opacity})`;
  }
  return props.theme === 'dark' ? defaultDark : defaultLight;
};

const getBorderColor = (props, defaultDark, defaultLight) => {
  if (props.hasBackgroundImage) {
    const opacity = Math.min((props.backgroundOpacity || 0.8) + 0.1, 1);
    return props.theme === 'dark' 
      ? `rgba(51, 51, 51, ${opacity})` 
      : `rgba(210, 210, 215, ${opacity})`;
  }
  return props.theme === 'dark' ? defaultDark : defaultLight;
};

const SidebarContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['collapsed', 'hasBackgroundImage', 'backgroundOpacity'].includes(prop)
})`
  width: ${props => props.collapsed ? '60px' : '200px'};
  height: 100%;
  --sidebar-opacity: ${props => props.backgroundOpacity || 0.8};
  --dark-bg-color: rgba(42, 42, 45, var(--sidebar-opacity));
  --light-bg-color: rgba(245, 245, 247, var(--sidebar-opacity));
  --dark-border-color: rgba(51, 51, 51, ${props => Math.min((props.backgroundOpacity || 0.8) + 0.1, 1)});
  --light-border-color: rgba(210, 210, 215, ${props => Math.min((props.backgroundOpacity || 0.8) + 0.1, 1)});
  
  background-color: ${props => {
    if (props.hasBackgroundImage) {
      return props.theme === 'dark' ? 'var(--dark-bg-color)' : 'var(--light-bg-color)';
    }
    return props.theme === 'dark' ? '#2a2a2d' : '#f5f5f7';
  }};
  border-right: 1px solid ${props => {
    if (props.hasBackgroundImage) {
      return props.theme === 'dark' ? 'var(--dark-border-color)' : 'var(--light-border-color)';
    }
    return props.theme === 'dark' ? '#333' : '#d2d2d7';
  }};
  display: flex;
  flex-direction: column;
  user-select: none;
  transition: width 0.3s ease, background-color 0.15s ease-out, border-color 0.15s ease-out;
  position: relative;
  backdrop-filter: ${props => props.hasBackgroundImage ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.hasBackgroundImage ? 'blur(10px)' : 'none'};
  z-index: 5;
  will-change: transform, opacity;
`;

const StoreTitle = styled.h1.withConfig({
  shouldForwardProp: (prop) => !['collapsed'].includes(prop)
})`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  margin: 20px 16px 0;
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
`;

const SidebarSection = styled.div.withConfig({
  shouldForwardProp: (prop) => !['hasTopMargin', 'fillSpace'].includes(prop)
})`
  margin-bottom: 20px;
  margin-top: ${props => props.hasTopMargin ? '40px' : '0'};
  flex: ${props => props.fillSpace ? '1' : '0'};
  display: flex;
  flex-direction: column;
`;

const SidebarTitle = styled.h3.withConfig({
  shouldForwardProp: (prop) => !['collapsed'].includes(prop)
})`
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#999' : '#86868b'};
  text-transform: uppercase;
  padding: 0 14px;
  margin: 14px 0 8px 0;
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity 0.2s ease, color 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
`;

const SidebarItem = styled.div.withConfig({
  shouldForwardProp: (prop) => !['collapsed', 'marginBottom', 'selected'].includes(prop)
})`
  display: flex;
  align-items: center;
  padding: 8px 14px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  cursor: pointer;
  border-radius: ${props => props.collapsed ? '8px' : '6px'};
  margin: ${props => props.collapsed ? '4px auto' : '4px 6px'};
  margin-bottom: ${props => props.marginBottom ? '8px' : '4px'};
  width: ${props => props.collapsed ? '44px' : 'auto'};
  height: ${props => props.collapsed ? '44px' : 'auto'};
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  transition: color 0.3s ease, background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(232, 232, 237, 0.8)'};
  }
  
  ${props => props.selected && `
    background-color: ${props.theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(232, 232, 237, 0.9)'};
    font-weight: 600;
  `}
`;

const ItemText = styled.span.withConfig({
  shouldForwardProp: (prop) => !['collapsed'].includes(prop)
})`
  transition: opacity 0.2s ease;
  opacity: ${props => props.collapsed ? 0 : 1};
  white-space: nowrap;
  overflow: hidden;
`;

const Icon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['collapsed', 'selected', 'color'].includes(prop)
})`
  width: 22px;
  height: 22px;
  margin-right: ${props => props.collapsed ? 0 : '8px'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    fill: ${props => {
      if (props.theme === 'dark') {
        return props.selected ? '#ffffff' : '#bbb';
      } else {
        return props.color || '#0066CC';
      }
    }};
    transition: fill 0.3s ease;
  }
`;

const CollapseButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['collapsed'].includes(prop)
})`
  position: absolute;
  top: 10px;
  right: ${props => props.collapsed ? '50%' : '10px'};
  transform: ${props => props.collapsed ? 'translateX(50%)' : 'none'};
  background-color: ${props => {
    if (props.theme === 'dark') {
      return props.collapsed ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
    } else {
      return props.collapsed ? '#e8e8ed' : 'transparent';
    }
  }};
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#86868b'};
  transition: right 0.3s ease, transform 0.3s ease, background-color 0.2s ease, color 0.3s ease;
  border-radius: 50%;
  z-index: 10;
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
    background-color: ${props => props.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e8e8ed'};
  }
  
  svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
    transform: ${props => props.collapsed ? 'rotate(180deg)' : 'none'};
    transition: transform 0.3s ease;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${props => getBorderColor(props, '#444', '#e8e8ed')};
  margin: 10px 10px;
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity 0.2s ease;
`;

// 创建优化的SidebarItem组件
const MemoizedSidebarItem = React.memo(({ selected, onClick, collapsed, theme, marginBottom, children }) => {
  return (
    <SidebarItem 
      selected={selected} 
      onClick={onClick}
      collapsed={collapsed}
      theme={theme}
      marginBottom={marginBottom}
    >
      {children}
    </SidebarItem>
  );
});

const Sidebar = ({ onCategorySelect, currentCategory, onToggleCollapse, defaultCollapsed = false, theme = 'light', hasBackgroundImage = false, backgroundOpacity = 0.8 }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => {
    // 从 localStorage 获取保存的状态，如果没有则使用 defaultCollapsed
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : defaultCollapsed;
  });
  
  useEffect(() => {
    // 当 collapsed 状态改变时保存到 localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const handleSelect = (category) => {
    onCategorySelect(category);
  };
  
  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (onToggleCollapse) {
      onToggleCollapse(newState);
    }
  };

  // 使用useMemo缓存各种分类项
  const categorySections = useMemo(() => {
    return (
      <>
        <SidebarSection hasTopMargin={true} fillSpace>
          <SidebarTitle collapsed={collapsed} theme={theme}>{t('categories.title')}</SidebarTitle>
          <MemoizedSidebarItem 
            selected={currentCategory === 'dev-tools'} 
            onClick={() => handleSelect('dev-tools')}
            collapsed={collapsed}
            theme={theme}
            marginBottom
          >
            <Icon collapsed={collapsed} selected={currentCategory === 'dev-tools'} theme={theme}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </Icon>
            <ItemText collapsed={collapsed}>{t('categories.all')}</ItemText>
          </MemoizedSidebarItem>
          <MemoizedSidebarItem 
            selected={currentCategory === 'software'} 
            onClick={() => handleSelect('software')}
            collapsed={collapsed}
            theme={theme}
            marginBottom
          >
            <Icon collapsed={collapsed} selected={currentCategory === 'software'} theme={theme}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
              </svg>
            </Icon>
            <ItemText collapsed={collapsed}>{t('categories.utilities')}</ItemText>
          </MemoizedSidebarItem>
          <MemoizedSidebarItem 
            selected={currentCategory === 'games'} 
            onClick={() => handleSelect('games')}
            collapsed={collapsed}
            theme={theme}
            marginBottom
          >
            <Icon collapsed={collapsed} selected={currentCategory === 'games'} theme={theme}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
            </Icon>
            <ItemText collapsed={collapsed}>{t('categories.games')}</ItemText>
          </MemoizedSidebarItem>
          <MemoizedSidebarItem 
            selected={currentCategory === 'ai-models'} 
            onClick={() => handleSelect('ai-models')}
            collapsed={collapsed}
            theme={theme}
          >
            <Icon collapsed={collapsed} selected={currentCategory === 'ai-models'} theme={theme}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21 11.18V9.72c0-.47-.16-.92-.46-1.28L16.6 3.72c-.38-.46-.94-.72-1.54-.72H8.94c-.6 0-1.15.26-1.54.72L3.46 8.44c-.3.36-.46.81-.46 1.28v1.45c0 .8.48 1.52 1.23 1.83v5.15c0 .46.37.83.83.83h14c.45 0 .82-.37.82-.82v-5.15c.74-.31 1.22-1.03 1.22-1.83zM12 17.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM5.94 10H8v1h2v-1h4v1h2v-1h2.06L12 5.5 5.94 10z"/>
              </svg>
            </Icon>
            <ItemText collapsed={collapsed}>{t('categories.ai')}</ItemText>
          </MemoizedSidebarItem>
        </SidebarSection>
        
        <Divider 
          theme={theme} 
          collapsed={collapsed} 
          hasBackgroundImage={hasBackgroundImage}
          backgroundOpacity={backgroundOpacity}
        />
        
        <SidebarSection>
          <MemoizedSidebarItem 
            selected={currentCategory === 'sources'} 
            onClick={() => handleSelect('sources')}
            collapsed={collapsed}
            theme={theme}
            marginBottom
          >
            <Icon collapsed={collapsed} selected={currentCategory === 'sources'} theme={theme}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
              </svg>
            </Icon>
            <ItemText collapsed={collapsed}>{t('sourceManager.title')}</ItemText>
          </MemoizedSidebarItem>
          
          <MemoizedSidebarItem 
            selected={currentCategory === 'settings'} 
            onClick={() => handleSelect('settings')}
            collapsed={collapsed}
            theme={theme}
          >
            <Icon collapsed={collapsed} selected={currentCategory === 'settings'} theme={theme}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </Icon>
            <ItemText collapsed={collapsed}>{t('settings.title')}</ItemText>
          </MemoizedSidebarItem>
        </SidebarSection>
      </>
    );
  }, [currentCategory, collapsed, theme, handleSelect, hasBackgroundImage, backgroundOpacity, t]);

  // 使用memo优化CollapseButton
  const collapseButton = useMemo(() => (
    <CollapseButton 
      collapsed={collapsed} 
      onClick={toggleCollapse} 
      title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')} 
      theme={theme}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </CollapseButton>
  ), [collapsed, toggleCollapse, theme, t]);

  return (
    <SidebarContainer 
      collapsed={collapsed} 
      theme={theme} 
      hasBackgroundImage={hasBackgroundImage}
      backgroundOpacity={backgroundOpacity}
    >
      <StoreTitle collapsed={collapsed} theme={theme}>OpenStore</StoreTitle>
      {collapseButton}
      {categorySections}
    </SidebarContainer>
  );
};

export default React.memo(Sidebar);