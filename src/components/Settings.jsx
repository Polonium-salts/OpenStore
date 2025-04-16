import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { isAcceleratedDownloadEnabled, toggleAcceleratedDownload } from './TauriDownloader';

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

// 新增用于背景图片的组件
const BackgroundPreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
`;

const BackgroundPreview = styled.div`
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid ${props => props.selected ? '#0066CC' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  background-image: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  position: relative;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &::before {
    content: '${props => props.label || ''}';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px;
    font-size: 10px;
    text-align: center;
  }
`;

const CustomBackgroundPreview = styled(BackgroundPreview)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: ${props => props.customImageUrl ? `url(${props.customImageUrl})` : 'none'};
  
  &::before {
    content: '${props => props.customImageUrl ? '自定义图片' : '上传图片'}';
  }
`;

const UploadButton = styled.div`
  font-size: 20px;
  color: ${props => props.theme === 'dark' ? '#888' : '#999'};
  display: ${props => props.hide ? 'none' : 'block'};
`;

const UploadInput = styled.input`
  display: none;
`;

const Button = styled.button`
  background-color: ${props => props.variant === 'danger' ? '#FF3B30' : '#0066CC'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
  display: ${props => props.hide ? 'none' : 'inline-block'};
  
  &:hover {
    opacity: 0.8;
  }
`;

const InputGroup = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
`;

const Input = styled.input`
  background-color: ${props => props.theme === 'dark' ? '#444' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  flex: 1;
  
  &:hover, &:focus {
    background-color: ${props => props.theme === 'dark' ? '#555' : '#e8e8ed'};
  }
`;

const SliderContainer = styled.div`
  margin-top: 16px;
  width: 100%;
  max-width: 300px;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const Slider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
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

// 为视图模式切换添加样式组件
const ViewModeContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewModeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background-color: ${props => props.selected 
    ? (props.theme === 'dark' ? 'rgba(0, 102, 204, 0.2)' : 'rgba(0, 102, 204, 0.1)')
    : (props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7')};
  color: ${props => props.selected 
    ? '#0066CC' 
    : (props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f')};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.selected 
      ? (props.theme === 'dark' ? 'rgba(0, 102, 204, 0.3)' : 'rgba(0, 102, 204, 0.2)')
      : (props.theme === 'dark' ? '#444' : '#e8e8ed')};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

// 默认背景图片列表
const DEFAULT_BACKGROUNDS = [
  { id: 'none', url: '', label: '无背景' },
  { id: 'bg1', url: 'https://cdn.pixabay.com/photo/2020/10/27/08/00/mountains-5689938_1280.png', label: '星空' },
  { id: 'bg2', url: 'https://cdn.pixabay.com/photo/2012/08/27/14/19/mountains-55067_1280.png', label: '山脉' },
  { id: 'bg3', url: 'https://media.istockphoto.com/id/1145054673/zh/%E5%90%91%E9%87%8F/%E6%B5%B7%E7%81%98.jpg?s=2048x2048&w=is&k=20&c=EPBjB3MJ4_A6_wM5CyLv2Ca7VVHLIQvL2BDXpHoL6yk=', label: '海洋' },
];

const Settings = ({ 
  theme, 
  language,
  viewMode,
  onThemeChange,
  onLanguageChange,
  onViewModeChange,
  backgroundImage,
  onBackgroundImageChange
}) => {
  const { t } = useTranslation();
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [customBgPreviewUrl, setCustomBgPreviewUrl] = useState('');
  const [opacity, setOpacity] = useState(() => {
    return parseFloat(localStorage.getItem('backgroundOpacity') || '0.8');
  });
  const fileInputRef = useRef(null);
  
  // Download settings states
  const [acceleratedDownload, setAcceleratedDownload] = useState(() => {
    return isAcceleratedDownloadEnabled();
  });
  const [autoRun, setAutoRun] = useState(() => {
    return localStorage.getItem('autoRunDownloads') === 'true';
  });
  const [autoExtract, setAutoExtract] = useState(() => {
    return localStorage.getItem('autoExtractDownloads') === 'true';
  });

  // Initialize customBgPreviewUrl with stored custom background if it exists
  useEffect(() => {
    const customBg = localStorage.getItem('customBackgroundImage');
    if (customBg) {
      setCustomBgPreviewUrl(customBg);
    }
  }, []);

  const handleThemeChange = (value) => {
    if (onThemeChange) {
      onThemeChange(value);
    }
  };

  const handleBackgroundChange = (backgroundId, url) => {
    // If it's the custom background
    if (backgroundId === 'custom') {
      onBackgroundImageChange(customBgPreviewUrl, opacity);
      localStorage.setItem('backgroundImage', customBgPreviewUrl);
      return;
    }
    
    onBackgroundImageChange(url, opacity);
    localStorage.setItem('backgroundImage', url);
  };

  const handleOpacityChange = (value) => {
    const newOpacity = parseFloat(value);
    setOpacity(newOpacity);
    onBackgroundImageChange(backgroundImage, newOpacity);
    localStorage.setItem('backgroundOpacity', newOpacity.toString());
  };
  
  // 处理上传背景图片
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    
    // 限制文件大小 (3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('图片大小不能超过3MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target.result;
      setCustomBgPreviewUrl(imgUrl);
      
      // 保存自定义图片到 localStorage
      localStorage.setItem('customBackgroundImage', imgUrl);
      
      // 设置为当前背景
      handleBackgroundChange('custom', imgUrl);
    };
    
    reader.readAsDataURL(file);
  };
  
  // 清除自定义背景
  const handleRemoveCustomBackground = () => {
    setCustomBgPreviewUrl('');
    localStorage.removeItem('customBackgroundImage');
    
    // 如果当前正在使用自定义背景，则重置为无背景
    if (backgroundImage === customBgPreviewUrl) {
      handleBackgroundChange('none', '');
    }
  };
  
  // 选择文件上传
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // 处理URL输入
  const handleUrlChange = (e) => {
    setCustomBgUrl(e.target.value);
  };

  // 通过URL加载图片
  const handleLoadUrlImage = () => {
    if (!customBgUrl) {
      alert('请输入图片URL');
      return;
    }

    // 检查URL格式
    try {
      new URL(customBgUrl);
    } catch (e) {
      alert('请输入有效的URL地址');
      return;
    }

    // 尝试加载图片
    const img = new Image();
    img.onload = () => {
      setCustomBgPreviewUrl(customBgUrl);
      localStorage.setItem('customBackgroundImage', customBgUrl);
      handleBackgroundChange('custom', customBgUrl);
      setCustomBgUrl(''); // 清空输入框
    };
    img.onerror = () => {
      alert('无法加载图片，请检查URL是否正确');
    };
    img.src = customBgUrl;
  };

  // Download settings handlers
  const handleAcceleratedDownloadToggle = () => {
    const newValue = !acceleratedDownload;
    
    // Save to localStorage and update the internal state
    localStorage.setItem('useAcceleratedDownload', newValue.toString());
    setAcceleratedDownload(newValue);
    
    // Explicitly call the utility function to ensure it's properly toggled
    toggleAcceleratedDownload(newValue);
    
    // Log for debugging
    console.log(`多线程加速下载模式: ${newValue ? '已启用' : '已禁用'}`);
  };

  const handleAutoRunToggle = () => {
    const newValue = !autoRun;
    setAutoRun(newValue);
    localStorage.setItem('autoRunDownloads', newValue);
  };

  const handleAutoExtractToggle = () => {
    const newValue = !autoExtract;
    setAutoExtract(newValue);
    localStorage.setItem('autoExtractDownloads', newValue);
  };

  return (
    <SettingsContainer theme={theme}>
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>{t('settings.title')}</SectionTitle>
        
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.theme')}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.themeDesc')}
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
              {t('settings.light')}
            </RadioLabel>
            <RadioLabel theme={theme} selected={theme === 'dark'}>
              <RadioInput
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={(e) => handleThemeChange(e.target.value)}
              />
              {t('settings.dark')}
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>
        
        {/* 新增视图模式设置 */}
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.viewMode')}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.viewModeDesc')}
          </OptionDescription>
          <RadioGroup>
            <ViewModeButton 
              theme={theme}
              selected={viewMode === 'grid'}
              onClick={() => onViewModeChange('grid')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </ViewModeButton>
            <ViewModeButton 
              theme={theme}
              selected={viewMode === 'list'}
              onClick={() => onViewModeChange('list')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </ViewModeButton>
          </RadioGroup>
        </OptionGroup>
        
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.background')}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.backgroundDesc')}
          </OptionDescription>
          <BackgroundPreviewContainer>
            {DEFAULT_BACKGROUNDS.map(bg => (
              <BackgroundPreview 
                key={bg.id}
                imageUrl={bg.url}
                theme={theme}
                selected={backgroundImage === bg.url}
                label={bg.label}
                onClick={() => handleBackgroundChange(bg.id, bg.url)}
              />
            ))}
            <CustomBackgroundPreview
              theme={theme}
              customImageUrl={customBgPreviewUrl}
              selected={backgroundImage === customBgPreviewUrl && customBgPreviewUrl}
              onClick={() => customBgPreviewUrl && handleBackgroundChange('custom')}
            >
              <UploadButton 
                theme={theme}
                hide={customBgPreviewUrl}
                onClick={handleUploadClick}
              >
                +
              </UploadButton>
              <UploadInput 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </CustomBackgroundPreview>
          </BackgroundPreviewContainer>
          
          <InputGroup>
            <Input 
              type="text"
              value={customBgUrl}
              onChange={handleUrlChange}
              placeholder={t('settings.backgroundURL')}
              theme={theme}
            />
            <Button onClick={handleLoadUrlImage}>{t('settings.load')}</Button>
          </InputGroup>
          
          {customBgPreviewUrl && (
            <Button 
              variant="danger" 
              onClick={handleRemoveCustomBackground}
            >
              {t('settings.removeCustomBackground')}
            </Button>
          )}
          
          {backgroundImage && (
            <SliderContainer>
              <OptionLabel theme={theme}>{t('settings.opacity')}</OptionLabel>
              <SliderLabel theme={theme}>
                <span>透明</span>
                <span>{Math.round(opacity * 100)}%</span>
                <span>不透明</span>
              </SliderLabel>
              <Slider 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05"
                value={opacity}
                onChange={(e) => handleOpacityChange(e.target.value)}
                theme={theme}
              />
            </SliderContainer>
          )}
        </OptionGroup>

        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.language')}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.languageDesc')}
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

      {/* Download Settings - New Section */}
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>{t('downloadManager.settings') || '下载设置'}</SectionTitle>
        
        <OptionGroup>
          <OptionLabel theme={theme}>{t('downloadManager.acceleratedDownload') || '加速下载'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.acceleratedDownloadDesc') || '使用多线程加速下载，可提高下载速度，但可能增加服务器负载'}
          </OptionDescription>
          <RadioGroup>
            <RadioLabel theme={theme} selected={acceleratedDownload}>
              <RadioInput 
                type="checkbox" 
                checked={acceleratedDownload} 
                onChange={handleAcceleratedDownloadToggle} 
              />
              {t('settings.enable') || '启用'}
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>

        <OptionGroup>
          <OptionLabel theme={theme}>{t('downloadManager.autoRun') || '自动运行'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.autoRunDesc') || '下载完成后自动运行可执行文件（仅适用于可执行文件）'}
          </OptionDescription>
          <RadioGroup>
            <RadioLabel theme={theme} selected={autoRun}>
              <RadioInput 
                type="checkbox" 
                checked={autoRun} 
                onChange={handleAutoRunToggle} 
              />
              {t('settings.enable') || '启用'}
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>

        <OptionGroup>
          <OptionLabel theme={theme}>{t('downloadManager.autoExtract') || '自动解压'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.autoExtractDesc') || '下载完成后自动解压压缩文件（支持zip、rar等常见格式）'}
          </OptionDescription>
          <RadioGroup>
            <RadioLabel theme={theme} selected={autoExtract}>
              <RadioInput 
                type="checkbox" 
                checked={autoExtract} 
                onChange={handleAutoExtractToggle} 
              />
              {t('settings.enable') || '启用'}
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>
      </SettingsSection>
    </SettingsContainer>
  );
};

// 添加默认值
Settings.defaultProps = {
  viewMode: 'grid',
  onViewModeChange: () => {},
  onLanguageChange: () => {}
};

export default Settings; 