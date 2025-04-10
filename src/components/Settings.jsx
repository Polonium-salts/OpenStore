import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SettingsContainer = styled.div`
  padding: 20px 0;
  width: 100%;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: color 0.3s ease;
`;

const SettingsTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: color 0.3s ease;
`;

const SettingsSection = styled.div`
  margin-bottom: 30px;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: color 0.3s ease;
`;

const OptionGroup = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const OptionLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: color 0.3s ease;
`;

const OptionDescription = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#888' : '#666'};
  margin-bottom: 12px;
  line-height: 1.4;
  max-width: 600px;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: ${props => {
    if (props.theme === 'dark') {
      return props.selected ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
    } else {
      return props.selected ? '#f0f0f5' : 'transparent';
    }
  }};
  transition: background-color 0.2s ease;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};

  &:hover {
    background-color: ${props => props.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f7'};
  }
`;

const RadioInput = styled.input`
  margin-right: 8px;
`;

const SelectDropdown = styled.select`
  background-color: ${props => props.theme === 'dark' ? '#444' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#555' : '#e8e8ed'};
  }
  
  option {
    background-color: ${props => props.theme === 'dark' ? '#333' : 'white'};
    color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  }
`;

const Settings = ({ 
  theme, 
  language,
  onThemeChange,
  onLanguageChange
}) => {
  // 处理主题变更
  const handleThemeChange = (value) => {
    // 保存到 localStorage
    localStorage.setItem('theme', value);
    // 通知父组件
    onThemeChange(value);
  };

  return (
    <SettingsContainer theme={theme}>
      <SettingsTitle theme={theme}>设置</SettingsTitle>

      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>外观</SectionTitle>
        <OptionGroup>
          <OptionLabel theme={theme}>主题</OptionLabel>
          <OptionDescription theme={theme}>
            选择应用的显示主题
          </OptionDescription>
          <RadioGroup>
            <RadioLabel theme={theme} selected={theme === 'light'}>
              <RadioInput
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={(e) => handleThemeChange(e.target.value)}
              />
              浅色
            </RadioLabel>
            <RadioLabel theme={theme} selected={theme === 'dark'}>
              <RadioInput
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={(e) => handleThemeChange(e.target.value)}
              />
              深色
            </RadioLabel>
            <RadioLabel theme={theme} selected={theme === 'system'}>
              <RadioInput
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={(e) => handleThemeChange(e.target.value)}
              />
              跟随系统
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>

        <OptionGroup>
          <OptionLabel theme={theme}>语言</OptionLabel>
          <OptionDescription theme={theme}>
            选择应用界面语言
          </OptionDescription>
          <SelectDropdown
            theme={theme}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </SelectDropdown>
        </OptionGroup>
      </SettingsSection>
    </SettingsContainer>
  );
};

export default Settings; 