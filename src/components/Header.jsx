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

const LanguageSelector = styled.select`
  background-color: transparent;
  border: none;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-size: 13px;
  padding: 0 5px;
  cursor: pointer;
  outline: none;
  
  &:focus {
    outline: none;
  }
  
  option {
    background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  }
`;

const Header = ({ onSearch, theme = 'light', language = 'zh' }) => {
  return (
    <HeaderContainer theme={theme}>
      <SearchBar>
        <SearchIcon theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </SearchIcon>
        <SearchInput 
          placeholder={language === 'zh' ? "搜索软件源" : "Search software sources"}
          onChange={(e) => onSearch(e.target.value)}
          theme={theme}
        />
      </SearchBar>
      
      <HeaderActions>
        <HeaderButton title={language === 'zh' ? "检查更新" : "Check Updates"} theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        </HeaderButton>
        <HeaderButton title={language === 'zh' ? "刷新" : "Refresh"} theme={theme}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </HeaderButton>
      </HeaderActions>
    </HeaderContainer>
  );
};

export default Header; 