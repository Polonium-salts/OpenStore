import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  height: 44px;
  background-color: ${props => props.theme === 'dark' ? 'rgba(30, 30, 32, 0.8)' : 'rgba(245, 245, 247, 0.8)'};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#d2d2d7'};
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color 0.3s ease, border-color 0.3s ease;
`;

const LogoText = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  margin-right: 20px;
  letter-spacing: 0.3px;
  transition: color 0.3s ease;
  cursor: default;
  user-select: none;
  
  span {
    color: #0066CC;
    font-weight: 700;
  }
`;

const SearchBar = styled.div`
  flex: 1;
  max-width: 580px;
  margin: 0 auto;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 32px;
  background-color: ${props => props.theme === 'dark' ? 'rgba(70, 70, 75, 0.2)' : 'rgba(142, 142, 147, 0.12)'};
  border-radius: 7px;
  border: none;
  padding: 0 34px;
  font-size: 13px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    background-color: ${props => props.theme === 'dark' ? 'rgba(70, 70, 75, 0.3)' : 'rgba(142, 142, 147, 0.18)'};
  }

  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#888' : '#86868b'};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 14px;
    height: 14px;
    fill: ${props => props.theme === 'dark' ? '#888' : '#86868b'};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
    fill: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  }
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const Header = ({ onSearch, theme = 'light' }) => {
  return (
    <HeaderContainer theme={theme}>
      <LogoText theme={theme}>
        <span>Open</span>Store
      </LogoText>
      <SearchBar>
        <SearchIcon theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </SearchIcon>
        <SearchInput 
          placeholder="搜索应用"
          onChange={(e) => onSearch(e.target.value)}
          theme={theme}
        />
      </SearchBar>
      
      <HeaderActions>
        <HeaderButton title="下载管理" theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </HeaderButton>
        <HeaderButton title="已安装" theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
        </HeaderButton>
        <HeaderButton title="通知" theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
          </svg>
        </HeaderButton>
      </HeaderActions>
    </HeaderContainer>
  );
};

export default Header; 