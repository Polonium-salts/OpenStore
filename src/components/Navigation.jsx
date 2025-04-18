import React, { useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: var(--nav-bg-color);
  backdrop-filter: blur(10px);
  z-index: 1000;
  transition: background-color 0.3s ease;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: var(--app-text-color);
  transition: color 0.3s ease;
`;

const NavLink = styled(Link)`
  color: var(--app-text-color);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.3s ease;

  &:hover {
    background-color: var(--nav-hover-bg);
  }

  &.active {
    background-color: var(--nav-active-bg);
    color: var(--nav-active-text);
  }
`;

const Navigation = React.memo(({ theme }) => {
  // 使用 useMemo 缓存主题变量
  const themeVariables = useMemo(() => ({
    dark: {
      navBgColor: 'rgba(29, 29, 31, 0.8)',
      navHoverBg: 'rgba(255, 255, 255, 0.1)',
      navActiveBg: 'rgba(255, 255, 255, 0.15)',
      navActiveText: '#ffffff'
    },
    light: {
      navBgColor: 'rgba(255, 255, 255, 0.8)',
      navHoverBg: 'rgba(0, 0, 0, 0.05)',
      navActiveBg: 'rgba(0, 0, 0, 0.1)',
      navActiveText: '#000000'
    }
  }), []);

  // 优化主题变量更新
  const updateThemeVariables = useCallback((theme) => {
    const root = document.documentElement;
    const vars = themeVariables[theme];
    
    // 使用 requestAnimationFrame 批量更新 CSS 变量
    requestAnimationFrame(() => {
      root.style.setProperty('--nav-bg-color', vars.navBgColor);
      root.style.setProperty('--nav-hover-bg', vars.navHoverBg);
      root.style.setProperty('--nav-active-bg', vars.navActiveBg);
      root.style.setProperty('--nav-active-text', vars.navActiveText);
    });
  }, [themeVariables]);

  // 初始化和主题变化时更新变量
  useEffect(() => {
    updateThemeVariables(theme);
  }, [theme, updateThemeVariables]);

  return (
    <NavContainer>
      <NavContent>
        {/* ... navigation content ... */}
      </NavContent>
    </NavContainer>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation; 