import React, { useState, useEffect, useRef } from 'react';
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
  { id: 'bg1', url: 'https://tse4-mm.cn.bing.net/th/id/OIP-C.m3K7YDzJ2UOgH05gPPtHJwHaEH?w=315&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7', label: '星空' },
  { id: 'bg2', url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1000', label: '山脉' },
  { id: 'bg3', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000', label: '海洋' },
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
  const [customImage, setCustomImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [opacity, setOpacity] = useState(() => {
    return parseFloat(localStorage.getItem('backgroundOpacity') || '0.8');
  });
  const fileInputRef = useRef(null);
  
  // 加载用户自定义背景图片
  useEffect(() => {
    const savedCustomImage = localStorage.getItem('customBackgroundImage');
    if (savedCustomImage) {
      setPreviewUrl(savedCustomImage);
      setCustomImage(savedCustomImage);
    }
  }, []);

  // 初始化透明度值到APP组件
  useEffect(() => {
    // 确保初始化时也传递当前透明度值
    if (backgroundImage) {
      handleOpacityChange(opacity);
    }
  }, []);
  
  // 处理主题变更
  const handleThemeChange = (value) => {
    // 保存到 localStorage
    localStorage.setItem('theme', value);
    // 通知父组件
    onThemeChange(value);
  };
  
  // 处理背景图片变更
  const handleBackgroundChange = (backgroundId, url) => {
    if (onBackgroundImageChange) {
      // 保存到 localStorage
      localStorage.setItem('backgroundImage', url);
      // 通知父组件
      onBackgroundImageChange(url, opacity);
    }
  };

  // 处理透明度变更
  const handleOpacityChange = (value) => {
    const opacityValue = parseFloat(value);
    setOpacity(opacityValue);
    localStorage.setItem('backgroundOpacity', opacityValue.toString());
    
    // 如果已有背景图片，更新透明度
    if (backgroundImage && onBackgroundImageChange) {
      onBackgroundImageChange(backgroundImage, opacityValue);
    }
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
      setPreviewUrl(imgUrl);
      
      // 保存自定义图片到 localStorage
      localStorage.setItem('customBackgroundImage', imgUrl);
      setCustomImage(imgUrl);
      
      // 设置为当前背景
      handleBackgroundChange('custom', imgUrl);
    };
    
    reader.readAsDataURL(file);
  };
  
  // 清除自定义背景
  const handleRemoveCustomBackground = () => {
    setPreviewUrl('');
    setCustomImage(null);
    localStorage.removeItem('customBackgroundImage');
    
    // 如果当前正在使用自定义背景，则重置为无背景
    if (backgroundImage === customImage) {
      handleBackgroundChange('none', '');
    }
  };
  
  // 选择文件上传
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // 处理URL输入
  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  // 通过URL加载图片
  const handleLoadUrlImage = () => {
    if (!imageUrl) {
      alert('请输入图片URL');
      return;
    }

    // 检查URL格式
    try {
      new URL(imageUrl);
    } catch (e) {
      alert('请输入有效的URL地址');
      return;
    }

    // 尝试加载图片
    const img = new Image();
    img.onload = () => {
      setPreviewUrl(imageUrl);
      localStorage.setItem('customBackgroundImage', imageUrl);
      setCustomImage(imageUrl);
      handleBackgroundChange('custom', imageUrl);
      setImageUrl(''); // 清空输入框
    };
    img.onerror = () => {
      alert('无法加载图片，请检查URL是否正确');
    };
    img.src = imageUrl;
  };

  return (
    <SettingsContainer theme={theme}>
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
        
        {/* 新增视图模式设置 */}
        <OptionGroup>
          <OptionLabel theme={theme}>视图模式</OptionLabel>
          <OptionDescription theme={theme}>
            选择应用展示的视图模式
          </OptionDescription>
          <ViewModeContainer>
            <ViewModeButton 
              theme={theme} 
              selected={viewMode === 'grid'}
              onClick={() => onViewModeChange('grid')}
              title="网格视图"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z"/>
              </svg>
            </ViewModeButton>
            <ViewModeButton 
              theme={theme} 
              selected={viewMode === 'list'}
              onClick={() => onViewModeChange('list')}
              title="列表视图"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </ViewModeButton>
          </ViewModeContainer>
        </OptionGroup>
        
        {/* 背景图片设置 */}
        <OptionGroup>
          <OptionLabel theme={theme}>背景图片</OptionLabel>
          <OptionDescription theme={theme}>
            为应用设置背景图片，自定义您的应用外观
          </OptionDescription>
          <BackgroundPreviewContainer>
            {DEFAULT_BACKGROUNDS.map(bg => (
              <BackgroundPreview 
                key={bg.id}
                theme={theme}
                imageUrl={bg.url}
                label={bg.label}
                selected={backgroundImage === bg.url}
                onClick={() => handleBackgroundChange(bg.id, bg.url)}
              />
            ))}
            <CustomBackgroundPreview 
              theme={theme}
              customImageUrl={previewUrl}
              selected={backgroundImage === customImage && customImage !== null}
              onClick={previewUrl ? () => handleBackgroundChange('custom', previewUrl) : handleUploadClick}
            >
              <UploadButton theme={theme} hide={previewUrl}>+</UploadButton>
              <UploadInput 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </CustomBackgroundPreview>
          </BackgroundPreviewContainer>
          
          {/* 通过URL添加背景图片 */}
          <InputGroup>
            <Input 
              type="text" 
              placeholder="输入图片URL"
              value={imageUrl}
              onChange={handleUrlChange}
              theme={theme}
            />
            <Button onClick={handleLoadUrlImage}>添加</Button>
          </InputGroup>
          
          <Button 
            variant="danger" 
            onClick={handleRemoveCustomBackground}
            hide={!previewUrl}
          >
            移除自定义背景
          </Button>
          
          {/* 背景不透明度设置 */}
          {backgroundImage && (
            <SliderContainer>
              <OptionLabel theme={theme}>背景不透明度</OptionLabel>
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

// 添加默认值
Settings.defaultProps = {
  viewMode: 'grid',
  onViewModeChange: () => {},
  onLanguageChange: () => {}
};

export default Settings; 