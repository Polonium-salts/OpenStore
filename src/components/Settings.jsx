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

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-right: 8px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #0066CC;
  }

  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#ccc'};
  transition: .4s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const ToggleOption = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ToggleLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: color 0.3s ease;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  margin: 16px 0;
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
  max-width: 300px;
  width: 100%;
  
  &:focus {
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.3);
  }
`;

const AboutText = styled.div`
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 14px;
  line-height: 1.5;
  transition: color 0.3s ease;
`;

const Button = styled.button`
  background-color: ${props => {
    if (props.primary) {
      return '#0066CC';
    } else {
      return props.theme === 'dark' ? '#444' : '#e0e0e0';
    }
  }};
  color: ${props => {
    if (props.primary) {
      return 'white';
    } else {
      return props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f';
    }
  }};
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  
  &:hover {
    background-color: ${props => {
      if (props.primary) {
        return '#0055B3';
      } else {
        return props.theme === 'dark' ? '#555' : '#d0d0d0';
      }
    }};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.3);
  }
`;

const DownloadInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 500px;
`;

const PathInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  border: 1px solid ${props => props.theme === 'dark' ? '#555' : '#d2d2d7'};
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #0066CC;
  }
`;

const Settings = ({ 
  theme, 
  language, 
  onThemeChange, 
  onLanguageChange,
  animation,
  downloadLocation,
  autoUpdate,
  wifiOnlyUpdate,
  hardwareAcceleration,
  sendUsageStats,
  onAnimationChange,
  onDownloadLocationChange,
  onAutoUpdateChange,
  onWifiOnlyUpdateChange,
  onHardwareAccelerationChange,
  onSendUsageStatsChange,
  onClearCache
}) => {
  // 本地状态用于下载位置输入
  const [downloadPath, setDownloadPath] = useState(downloadLocation);
  
  // 每当下载位置改变时更新本地状态
  useEffect(() => {
    setDownloadPath(downloadLocation);
  }, [downloadLocation]);
  
  const handleBrowseClick = () => {
    // 在实际应用中，这里会调用文件选择器
    console.log('选择下载位置文件夹');
    // 模拟选择文件夹
    const newPath = '/Users/选择的路径';
    setDownloadPath(newPath);
    onDownloadLocationChange(newPath);
  };
  
  const handleDownloadPathChange = (e) => {
    setDownloadPath(e.target.value);
  };
  
  const handleDownloadPathBlur = () => {
    onDownloadLocationChange(downloadPath);
  };
  
  const handleThemeChange = (e) => {
    onThemeChange(e.target.value);
  };
  
  const handleLanguageChange = (e) => {
    onLanguageChange(e.target.value);
  };
  
  return (
    <SettingsContainer theme={theme}>
      <SettingsTitle theme={theme}>设置</SettingsTitle>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>外观</SectionTitle>
        <OptionGroup>
          <OptionLabel theme={theme}>主题</OptionLabel>
          <OptionDescription theme={theme}>选择应用的外观主题</OptionDescription>
          <RadioGroup>
            <RadioLabel theme={theme} selected={theme === 'light'}>
              <RadioInput 
                type="radio" 
                name="theme" 
                value="light" 
                checked={theme === 'light'} 
                onChange={handleThemeChange}
              />
              浅色
            </RadioLabel>
            <RadioLabel theme={theme} selected={theme === 'dark'}>
              <RadioInput 
                type="radio" 
                name="theme" 
                value="dark" 
                checked={theme === 'dark'} 
                onChange={handleThemeChange}
              />
              深色
            </RadioLabel>
            <RadioLabel theme={theme} selected={theme === 'system'}>
              <RadioInput 
                type="radio" 
                name="theme" 
                value="system" 
                checked={theme === 'system'} 
                onChange={handleThemeChange}
              />
              跟随系统
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>
        
        <Divider theme={theme} />
        
        <OptionGroup>
          <OptionLabel theme={theme}>语言</OptionLabel>
          <OptionDescription theme={theme}>选择应用的显示语言</OptionDescription>
          <SelectDropdown 
            theme={theme} 
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </SelectDropdown>
        </OptionGroup>
        
        <Divider theme={theme} />
        
        <OptionGroup>
          <OptionLabel theme={theme}>界面动画</OptionLabel>
          <OptionDescription theme={theme}>启用或禁用应用界面动画效果</OptionDescription>
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={animation} 
                onChange={(e) => onAnimationChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>{animation ? '已启用' : '已禁用'}</ToggleLabel>
          </ToggleOption>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>下载设置</SectionTitle>
        <OptionGroup>
          <OptionLabel theme={theme}>下载位置</OptionLabel>
          <OptionDescription theme={theme}>设置应用下载文件的保存位置</OptionDescription>
          <DownloadInput>
            <PathInput 
              theme={theme} 
              type="text" 
              value={downloadPath}
              onChange={handleDownloadPathChange}
              onBlur={handleDownloadPathBlur}
            />
            <Button theme={theme} onClick={handleBrowseClick}>浏览...</Button>
          </DownloadInput>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>通用设置</SectionTitle>
        <OptionGroup>
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={autoUpdate} 
                onChange={(e) => onAutoUpdateChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>自动更新应用</ToggleLabel>
          </ToggleOption>
          
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={wifiOnlyUpdate} 
                onChange={(e) => onWifiOnlyUpdateChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>仅在WIFI网络下更新</ToggleLabel>
          </ToggleOption>
          
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={hardwareAcceleration} 
                onChange={(e) => onHardwareAccelerationChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>启用硬件加速</ToggleLabel>
          </ToggleOption>
          
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={sendUsageStats} 
                onChange={(e) => onSendUsageStatsChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>发送匿名使用数据</ToggleLabel>
          </ToggleOption>
        </OptionGroup>
        
        <Divider theme={theme} />
        
        <OptionGroup>
          <OptionLabel theme={theme}>缓存</OptionLabel>
          <OptionDescription theme={theme}>清除应用缓存数据，可能会暂时影响应用性能</OptionDescription>
          <Button theme={theme} onClick={onClearCache}>清除缓存</Button>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>关于</SectionTitle>
        <AboutText theme={theme}>
          Open Store v0.1.0<br />
          一个开源的应用商店<br />
          <br />
          © 2023 Open Store Team
        </AboutText>
      </SettingsSection>
    </SettingsContainer>
  );
};

export default Settings; 