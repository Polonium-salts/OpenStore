import React, { useState } from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  height: 64px;
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  margin-right: 24px;
  min-width: 120px;
`;

const Logo = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  
  span {
    color: #0066CC;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 600px;
  position: relative;
  margin: 0 24px;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 40px;
  border-radius: 8px;
  border: none;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#ffffff'};
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
  }
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  display: flex;
  align-items: center;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const HeaderButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background-color: ${props => props.active ? 
    (props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed') : 
    'transparent'
  };
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  }
  
  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  &::after {
    content: attr(title);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    border-radius: 4px;
    background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#1d1d1f'};
    color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#ffffff'};
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }

  &:hover::after {
    opacity: 1;
    visibility: visible;
  }
`;

const Header = ({ theme, onSearch, onToggleDownloadManager, isDownloadManagerVisible }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <HeaderContainer theme={theme}>
      <LogoSection>
        <Logo theme={theme}>
          <span>Open</span>Store
        </Logo>
      </LogoSection>

      <SearchContainer>
        <SearchIcon theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder="搜索应用..."
          value={searchTerm}
          onChange={handleSearch}
          theme={theme}
        />
      </SearchContainer>

      <HeaderActions>
        <HeaderButton 
          title="下载管理"
          theme={theme}
          active={isDownloadManagerVisible}
          onClick={onToggleDownloadManager}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </HeaderButton>
        <HeaderButton 
          title="已安装"
          theme={theme}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
        </HeaderButton>
        <HeaderButton 
          title="通知"
          theme={theme}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
          </svg>
        </HeaderButton>
      </HeaderActions>
    </HeaderContainer>
  );
};

export default Header; 