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

const RangeContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin-bottom: 12px;
`;

const RangeSlider = styled.input`
  width: 100%;
  height: 4px;
  background: ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0066CC;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0066CC;
    cursor: pointer;
    border: none;
  }
`;

const RangeValue = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#888' : '#666'};
  margin-top: 6px;
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

// 窗口大小设置样式
const SizeInputsContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
`;

const SizeInput = styled.input`
  width: 80px;
  padding: 8px;
  border-radius: 6px;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  border: 1px solid ${props => props.theme === 'dark' ? '#555' : '#d2d2d7'};
  text-align: center;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: #0066CC;
  }
  
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const SizeDimension = styled.span`
  color: ${props => props.theme === 'dark' ? '#999' : '#86868b'};
  font-size: 13px;
`;

const ApplyButton = styled.button`
  background-color: #0066CC;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #0055AA;
  }
  
  &:disabled {
    background-color: ${props => props.theme === 'dark' ? '#444' : '#d1d1d6'};
    color: ${props => props.theme === 'dark' ? '#777' : '#999'};
    cursor: not-allowed;
  }
`;

const Settings = ({ 
  theme, 
  language, 
  onThemeChange, 
  onLanguageChange,
  windowSize,
  onWindowSizeChange,
  gridSize,
  animation,
  downloadLocation,
  appDisplayMode,
  autoUpdate,
  wifiOnlyUpdate,
  preloadPopularApps,
  hardwareAcceleration,
  sendUsageStats,
  allowThirdPartyTracking,
  onGridSizeChange,
  onAnimationChange,
  onDownloadLocationChange,
  onAppDisplayModeChange,
  onAutoUpdateChange,
  onWifiOnlyUpdateChange,
  onPreloadPopularAppsChange,
  onHardwareAccelerationChange,
  onSendUsageStatsChange,
  onAllowThirdPartyTrackingChange,
  onClearCache
}) => {
  // 本地窗口大小状态（用于修改前的暂存）
  const [customWidth, setCustomWidth] = useState(windowSize.width);
  const [customHeight, setCustomHeight] = useState(windowSize.height);
  
  // 当props更新时同步本地状态
  useEffect(() => {
    setCustomWidth(windowSize.width);
    setCustomHeight(windowSize.height);
  }, [windowSize]);

  // 窗口大小应用按钮点击处理函数
  const handleApplyWindowSize = () => {
    onWindowSizeChange({
      width: customWidth,
      height: customHeight
    });
  };

  return (
    <SettingsContainer theme={theme}>
      <SettingsTitle theme={theme}>设置</SettingsTitle>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>外观</SectionTitle>
        <OptionGroup>
          <OptionLabel theme={theme}>主题</OptionLabel>
          <RadioGroup>
            <RadioLabel selected={theme === 'light'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="theme" 
                value="light" 
                checked={theme === 'light'} 
                onChange={() => onThemeChange('light')} 
              />
              浅色
            </RadioLabel>
            <RadioLabel selected={theme === 'dark'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="theme" 
                value="dark" 
                checked={theme === 'dark'} 
                onChange={() => onThemeChange('dark')} 
              />
              深色
            </RadioLabel>
            <RadioLabel selected={theme === 'system'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="theme" 
                value="system" 
                checked={theme === 'system'} 
                onChange={() => onThemeChange('system')} 
              />
              跟随系统
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>
        
        <Divider theme={theme} />
        
        <OptionGroup>
          <OptionLabel theme={theme}>窗口大小</OptionLabel>
          <OptionDescription theme={theme}>
            设置应用程序窗口的尺寸（最小宽度800px，最小高度600px）
          </OptionDescription>
          <SizeInputsContainer>
            <SizeInput 
              type="number" 
              min="800" 
              max="3840" 
              value={customWidth}
              onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 800)}
              theme={theme}
            />
            <SizeDimension theme={theme}>×</SizeDimension>
            <SizeInput 
              type="number" 
              min="600" 
              max="2160" 
              value={customHeight}
              onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 600)}
              theme={theme}
            />
            <SizeDimension theme={theme}>像素</SizeDimension>
            <ApplyButton 
              onClick={handleApplyWindowSize}
              disabled={customWidth < 800 || customHeight < 600}
              theme={theme}
            >
              应用窗口大小
            </ApplyButton>
          </SizeInputsContainer>
          <OptionDescription theme={theme}>
            当前窗口大小: {windowSize.width} × {windowSize.height} 像素
          </OptionDescription>
        </OptionGroup>
        
        <Divider theme={theme} />
        
        <OptionGroup>
          <OptionLabel theme={theme}>应用展示方式</OptionLabel>
          <OptionDescription theme={theme}>
            选择应用程序在主页和分类页面中的显示方式
          </OptionDescription>
          <RadioGroup>
            <RadioLabel selected={appDisplayMode === 'grid'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="displayMode" 
                value="grid" 
                checked={appDisplayMode === 'grid'} 
                onChange={() => onAppDisplayModeChange('grid')} 
              />
              网格视图
            </RadioLabel>
            <RadioLabel selected={appDisplayMode === 'list'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="displayMode" 
                value="list" 
                checked={appDisplayMode === 'list'} 
                onChange={() => onAppDisplayModeChange('list')} 
              />
              列表视图
            </RadioLabel>
            <RadioLabel selected={appDisplayMode === 'compact'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="displayMode" 
                value="compact" 
                checked={appDisplayMode === 'compact'} 
                onChange={() => onAppDisplayModeChange('compact')} 
              />
              紧凑视图
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>
        
        <OptionGroup>
          <OptionLabel theme={theme}>网格大小</OptionLabel>
          <RangeContainer>
            <RangeSlider 
              type="range" 
              min="3" 
              max="6" 
              value={gridSize} 
              onChange={(e) => onGridSizeChange(parseInt(e.target.value, 10))} 
              theme={theme}
            />
            <RangeValue theme={theme}>
              <span>小</span>
              <span>中</span>
              <span>大</span>
            </RangeValue>
          </RangeContainer>
        </OptionGroup>
        
        <OptionGroup>
          <OptionLabel theme={theme}>界面动画</OptionLabel>
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={animation} 
                onChange={(e) => onAnimationChange(e.target.checked)} 
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>启用界面动画效果</ToggleLabel>
          </ToggleOption>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>下载与安装</SectionTitle>
        <OptionGroup>
          <OptionLabel theme={theme}>默认下载位置</OptionLabel>
          <SelectDropdown 
            theme={theme}
            value={downloadLocation}
            onChange={(e) => onDownloadLocationChange(e.target.value)}
          >
            <option value="/Downloads">下载文件夹</option>
            <option value="/Desktop">桌面</option>
            <option value="/Documents">文档</option>
            <option value="/custom">自定义位置</option>
          </SelectDropdown>
        </OptionGroup>
        
        <OptionGroup>
          <OptionLabel theme={theme}>自动更新</OptionLabel>
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={autoUpdate} 
                onChange={(e) => onAutoUpdateChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>应用自动更新</ToggleLabel>
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
            <ToggleLabel theme={theme}>仅在Wi-Fi连接时下载更新</ToggleLabel>
          </ToggleOption>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>性能</SectionTitle>
        <OptionGroup>
          <OptionLabel theme={theme}>预加载</OptionLabel>
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={preloadPopularApps}
                onChange={(e) => onPreloadPopularAppsChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>预加载流行应用数据</ToggleLabel>
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
        </OptionGroup>
        
        <OptionGroup>
          <OptionLabel theme={theme}>缓存</OptionLabel>
          <OptionDescription theme={theme}>
            当前缓存大小: 124MB
          </OptionDescription>
          <button style={{ 
            padding: '6px 12px', 
            backgroundColor: theme === 'dark' ? '#444' : '#f5f5f7',
            color: theme === 'dark' ? '#f5f5f7' : '#1d1d1f',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
          onClick={onClearCache}>
            清除缓存
          </button>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>语言和地区</SectionTitle>
        <OptionGroup>
          <OptionLabel theme={theme}>应用语言</OptionLabel>
          <RadioGroup>
            <RadioLabel selected={language === 'zh'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="language" 
                value="zh" 
                checked={language === 'zh'} 
                onChange={() => onLanguageChange('zh')} 
              />
              简体中文
            </RadioLabel>
            <RadioLabel selected={language === 'en'} theme={theme}>
              <RadioInput 
                type="radio" 
                name="language" 
                value="en" 
                checked={language === 'en'} 
                onChange={() => onLanguageChange('en')} 
              />
              English
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>隐私与安全</SectionTitle>
        <OptionGroup>
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={sendUsageStats}
                onChange={(e) => onSendUsageStatsChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>允许应用发送使用统计信息</ToggleLabel>
          </ToggleOption>
          <ToggleOption>
            <ToggleSwitch>
              <ToggleInput 
                type="checkbox" 
                checked={allowThirdPartyTracking}
                onChange={(e) => onAllowThirdPartyTrackingChange(e.target.checked)}
              />
              <ToggleSlider theme={theme} />
            </ToggleSwitch>
            <ToggleLabel theme={theme}>允许第三方应用跟踪</ToggleLabel>
          </ToggleOption>
        </OptionGroup>
      </SettingsSection>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>关于</SectionTitle>
        <AboutText theme={theme}>
          <p>OpenStore v1.0.0</p>
          <p>© 2023 OpenStore 团队</p>
          <p>一个开源的基于Tauri和React的跨平台应用商店</p>
          <p>Open Store - 你的跨平台应用商店</p>
        </AboutText>
      </SettingsSection>
    </SettingsContainer>
  );
};

export default Settings; 