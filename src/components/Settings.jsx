import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

import { platform, arch, version, type as osType, locale } from '@tauri-apps/plugin-os';
import { isWebKit, isMacOS, applyWebKitFixes, applyMacOSFixes, forceRepaint, initWebKitFixes } from '../utils/wkwebviewUtils';

const SettingsContainer = styled.div`
  padding: 20px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  color: var(--app-text-color);
  transition: color 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  /* WebKit兼容性修复（支持macOS、iOS、Linux） */
  ${props => props.isWebKit ? `
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    contain: layout style;
    will-change: auto;
    overflow: visible;
    min-height: 100vh;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative;
    z-index: 1;
    isolation: isolate;
    
    /* 确保所有子元素都可见 */
    * {
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* 防止白屏的额外修复 */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
      z-index: -1;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
  ` : ''}
`;

const SettingsTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--app-text-color);
  transition: color 0.3s ease;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
`;

const SettingsSection = styled.div`
  margin-bottom: 20px;
  background-color: var(--section-bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 10px var(--shadow-color);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 20px var(--shadow-color);
    transform: translateY(-2px);
  }
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: var(--app-text-color);
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 20px;
    background-color: var(--accent-color);
    margin-right: 12px;
    border-radius: 4px;
  }
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 15px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const OptionLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: color 0.3s ease;
`;

const OptionDescription = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  margin-bottom: 16px;
  line-height: 1.5;
  max-width: 700px;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 8px;
  background-color: ${props => {
    if (props.theme === 'dark') {
      return props.selected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    } else {
      return props.selected ? '#f0f0f5' : '#f8f8fa';
    }
  }};
  transition: all 0.2s ease;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-weight: ${props => props.selected ? '500' : '400'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e8e8ed'};
    transform: translateY(-2px);
  }
`;

const RadioInput = styled.input`
  margin-right: 10px;
  accent-color: var(--accent-color);
`;

const SelectDropdown = styled.select`
  background-color: ${props => props.theme === 'dark' ? '#444' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 15px;
  cursor: pointer;
  outline: none;
  max-width: 300px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#555' : '#e8e8ed'};
  }
  
  &:focus {
    box-shadow: 0 0 0 2px var(--accent-color);
  }
  
  option {
    background-color: ${props => props.theme === 'dark' ? '#333' : 'white'};
    color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
    padding: 8px;
  }
`;

// 新增用于背景图片的组件
const BackgroundPreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 16px;
  margin-bottom: 20px;
`;

const BackgroundPreview = styled.div`
  width: 140px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid ${props => props.selected ? 'var(--accent-color)' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  background-image: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: scale(1.05) translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  &::before {
    content: '${props => props.label || ''}';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 6px;
    font-size: 12px;
    text-align: center;
    font-weight: 500;
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
  font-size: 26px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#999'};
  display: ${props => props.hide ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  
  &:hover {
    color: var(--accent-color);
  }
`;

const UploadInput = styled.input`
  display: none;
`;

const Button = styled.button`
  background-color: ${props => props.variant === 'danger' 
    ? (props.theme === 'dark' ? '#b71c1c' : '#f44336')
    : 'var(--input-bg-color)'
  };
  color: ${props => props.variant === 'danger' ? 'white' : 'var(--input-text-color)'};
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background-color: ${props => props.variant === 'danger'
      ? (props.theme === 'dark' ? '#d32f2f' : '#ef5350')
      : 'var(--input-hover-color)'
    };
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SystemInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const SystemInfoCard = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : '#ffffff'};
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px var(--shadow-color);
    transform: translateY(-2px);
  }
`;

const SystemInfoLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const SystemInfoValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: var(--app-text-color);
  word-break: break-word;
`;

const RefreshButton = styled(Button)`
  margin-top: 16px;
  background-color: var(--accent-color);
  color: white;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#5bb3f7' : '#0052a3'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    
    svg {
      animation: spin 1s linear infinite;
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const InputGroup = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 500px;
`;

const Input = styled.input`
  background-color: var(--input-bg-color);
  color: var(--input-text-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 15px;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.25);
  }
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#777' : '#aaa'};
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

// 自定义的分离式滑块组件，避免频繁重渲染
const FastSlider = React.memo(({ value, min, max, step, onChange, theme }) => {
  const sliderRef = useRef(null);
  const [localValue, setLocalValue] = useState(value);
  const isUpdatingRef = useRef(false);
  const timeoutRef = useRef(null);
  
  // 使用RAF优化视觉更新
  const updateVisualStyle = useCallback((newValue) => {
    requestAnimationFrame(() => {
      // 更新CSS变量 - 立即显示效果
      document.documentElement.style.setProperty('--app-bg-opacity', newValue);
      
      // 更新显示的百分比文本
      const percentEl = sliderRef.current?.parentElement?.querySelector('.slider-percent');
      if (percentEl) {
        percentEl.textContent = `${Math.round(newValue * 100)}%`;
      }
    });
  }, []);
  
  // 当外部value变化时同步，但避免循环更新
  useEffect(() => {
    if (!isUpdatingRef.current && Math.abs(value - localValue) > 0.01) {
      setLocalValue(value);
      updateVisualStyle(value);
    }
  }, [value, localValue, updateVisualStyle]);
  
  // 处理滑块变化 - 实时更新视觉效果
  const handleChange = useCallback((event) => {
    const newValue = parseFloat(event.target.value);
    setLocalValue(newValue);
    updateVisualStyle(newValue);
    
    // 防抖通知父组件
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    isUpdatingRef.current = true;
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      isUpdatingRef.current = false;
    }, 100);
  }, [updateVisualStyle, onChange]);
  
  // 滑动结束时立即通知父组件
  const handleChangeEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isUpdatingRef.current = true;
    onChange(localValue);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [onChange, localValue]);
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div ref={sliderRef} className="fast-slider">
      <SliderLabel theme={theme}>
        <span>透明</span>
        <span className="slider-percent">{Math.round(localValue * 100)}%</span>
        <span>不透明</span>
      </SliderLabel>
      <Slider
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        onMouseUp={handleChangeEnd}
        onTouchEnd={handleChangeEnd}
        theme={theme}
      />
    </div>
  );
});

// 添加优化预加载函数
const preloadBackgrounds = (() => {
  const cache = new Set();
  
  return (backgrounds) => {
    backgrounds.forEach(bg => {
      if (bg.url && !cache.has(bg.url)) {
        const img = new Image();
        img.onload = () => cache.add(bg.url);
        img.src = bg.url;
      }
    });
  };
})();

// 优化背景预览组件
const OptimizedBackgroundPreview = React.memo(({ 
  imageUrl, 
  theme, 
  selected, 
  label, 
  onClick,
  isCustom = false,
  customImageUrl,
  hideUploadButton = false,
  onUploadClick,
  children
}) => {
  // 处理背景预览组件逻辑，减少重渲染

  if (isCustom) {
    return (
      <CustomBackgroundPreview
        theme={theme}
        customImageUrl={customImageUrl}
        selected={selected}
        onClick={() => customImageUrl && customImageUrl !== 'loading' && onClick()}
      >
        {customImageUrl === 'loading' ? (
          <div>加载中...</div>
        ) : (
          !hideUploadButton && (
            <UploadButton 
              theme={theme}
              hide={customImageUrl}
              onClick={onUploadClick}
            >
              +
            </UploadButton>
          )
        )}
        {children}
      </CustomBackgroundPreview>
    );
  }
  
  return (
    <BackgroundPreview 
      imageUrl={imageUrl}
      theme={theme}
      selected={selected}
      label={label}
      onClick={onClick}
    />
  );
});

// 使用 React.lazy 和 Suspense 优化组件加载
const Settings = React.memo(({ 
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
    // 从localStorage获取值，如果没有则使用默认值0.8
    return parseFloat(localStorage.getItem('backgroundOpacity') || '0.8');
  });
  const [localOpacity, setLocalOpacity] = useState(() => {
    // 确保与opacity初始值一致
    return parseFloat(localStorage.getItem('backgroundOpacity') || '0.8');
  });
  
  // WebKit兼容性状态（支持macOS、iOS、Linux）
  const [isWebKitReady, setIsWebKitReady] = useState(!isWebKit());
  
  const fileInputRef = useRef(null);
  const opacityUpdateTimeoutRef = useRef(null);
  
  // 主题相关CSS变量初始化
  useEffect(() => {
    // 设置主题相关的CSS变量
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--section-bg-color', '#333');
      document.documentElement.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
      document.documentElement.style.setProperty('--input-bg-color', '#444');
      document.documentElement.style.setProperty('--input-text-color', '#f5f5f7');
      document.documentElement.style.setProperty('--input-hover-color', '#555');
      document.documentElement.style.setProperty('--border-color', '#555');
      document.documentElement.style.setProperty('--accent-color', '#4dabf7');
      document.documentElement.style.setProperty('--accent-bg-color', 'rgba(77, 171, 247, 0.1)');
    } else {
      document.documentElement.style.setProperty('--section-bg-color', '#f5f5f7');
      document.documentElement.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
      document.documentElement.style.setProperty('--input-bg-color', '#ffffff');
      document.documentElement.style.setProperty('--input-text-color', '#1d1d1f');
      document.documentElement.style.setProperty('--input-hover-color', '#e8e8ed');
      document.documentElement.style.setProperty('--border-color', '#ced4da');
      document.documentElement.style.setProperty('--accent-color', '#0066CC');
      document.documentElement.style.setProperty('--accent-bg-color', 'rgba(0, 102, 204, 0.1)');
    }
  }, [theme]);
  
  // 优化初始化加载
  useEffect(() => {
    // 预加载默认背景图片（优先级低）
    // 兼容性处理：某些WebKit环境不支持requestIdleCallback
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => {
        preloadBackgrounds(DEFAULT_BACKGROUNDS);
      });
    } else {
      // fallback: 使用setTimeout延迟执行
      setTimeout(() => {
        preloadBackgrounds(DEFAULT_BACKGROUNDS);
      }, 100);
    }
    
    // 获取当前CSS变量值
    const computedStyle = getComputedStyle(document.documentElement);
    const currentOpacity = computedStyle.getPropertyValue('--app-bg-opacity').trim();
    
    if (currentOpacity) {
      const opacityValue = parseFloat(currentOpacity);
      if (!isNaN(opacityValue) && Math.abs(opacityValue - localOpacity) > 0.01) {
        setLocalOpacity(opacityValue);
        setOpacity(opacityValue);
      }
    }
  }, []);

  // WebKit兼容性修复（支持macOS、iOS、Linux）
  useEffect(() => {
    if (isWebKit()) {
      console.log('Applying enhanced WebKit compatibility fixes for Settings component');
      
      // 初始化WebKit特定修复（支持所有WebKit平台）
      const cleanup = initWebKitFixes({
        autoRepaint: true,
        repaintDelay: 100,
        settingsPageFix: true
      });
      
      // 立即应用基础修复
      const applyImmediateFixes = () => {
        const settingsContainer = document.querySelector('[data-settings-container]');
        if (settingsContainer) {
          // 防止白屏的关键样式
          settingsContainer.style.visibility = 'visible !important';
          settingsContainer.style.opacity = '1 !important';
          settingsContainer.style.display = 'flex';
          settingsContainer.style.minHeight = '100vh';
          settingsContainer.style.position = 'relative';
          settingsContainer.style.zIndex = '1';
          settingsContainer.style.isolation = 'isolate';
          
          // 应用WebKit修复（支持所有WebKit平台）
          applyWebKitFixes(settingsContainer);
          
          // 如果是macOS，应用额外的macOS特定修复
          if (isMacOS()) {
            applyMacOSFixes(settingsContainer);
          }
          
          // 强制重绘
          forceRepaint(settingsContainer);
        }
      };
      
      // 立即应用修复
      applyImmediateFixes();
      
      // 延迟应用修复以确保DOM已完全渲染
      const timer = setTimeout(() => {
        const settingsContainer = document.querySelector('[data-settings-container]');
        if (settingsContainer) {
          // 再次确保可见性
          settingsContainer.style.visibility = 'visible !important';
          settingsContainer.style.opacity = '1 !important';
          
          // 修复所有子元素
          const childElements = settingsContainer.querySelectorAll('*');
          childElements.forEach(child => {
            child.style.visibility = 'visible !important';
            child.style.opacity = '1 !important';
            
            if (child.offsetHeight === 0 || child.offsetWidth === 0) {
              applyWebKitFixes(child);
              if (isMacOS()) {
                applyMacOSFixes(child);
              }
              forceRepaint(child);
            }
          });
          
          // 多次重绘确保渲染
          forceRepaint(settingsContainer);
          setTimeout(() => forceRepaint(settingsContainer), 100);
          setTimeout(() => forceRepaint(settingsContainer), 200);
          
          // 标记WebKit准备完成
          setIsWebKitReady(true);
        }
      }, 150);
      
      // 额外的延迟修复，确保所有组件都已渲染
      const secondTimer = setTimeout(() => {
        const settingsContainer = document.querySelector('[data-settings-container]');
        if (settingsContainer) {
          // 最终检查和修复
          const computedStyle = getComputedStyle(settingsContainer);
          if (computedStyle.visibility === 'hidden' || computedStyle.opacity === '0' || settingsContainer.offsetHeight === 0) {
            console.warn('Settings container still has visibility issues, applying emergency fixes');
            settingsContainer.style.visibility = 'visible !important';
            settingsContainer.style.opacity = '1 !important';
            settingsContainer.style.display = 'flex !important';
            settingsContainer.style.minHeight = '100vh';
            forceRepaint(settingsContainer);
            
            // 强制触发重排
            settingsContainer.offsetHeight;
            document.body.offsetHeight;
          }
          
          // 确保准备状态已设置
          setIsWebKitReady(true);
        }
      }, 500);
      
      // 持续监控机制
      const monitorInterval = setInterval(() => {
        const settingsContainer = document.querySelector('[data-settings-container]');
        if (settingsContainer) {
          const computedStyle = getComputedStyle(settingsContainer);
          if (computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
            console.warn('Settings container became hidden, reapplying fixes');
            settingsContainer.style.visibility = 'visible !important';
            settingsContainer.style.opacity = '1 !important';
            forceRepaint(settingsContainer);
          }
        }
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(secondTimer);
        clearInterval(monitorInterval);
        if (cleanup) cleanup();
      };
    } else {
      // 非WebKit环境也要确保准备状态
      setIsWebKitReady(true);
    }
  }, []);

  // 当backgroundImage或theme改变时，确保透明度正确显示
  useEffect(() => {
    // 这里我们只需要更新本地UI状态
    const savedOpacity = parseFloat(localStorage.getItem('backgroundOpacity') || '0.8');
    if (Math.abs(savedOpacity - localOpacity) > 0.01) {
      setLocalOpacity(savedOpacity);
      setOpacity(savedOpacity);
      // 同步更新CSS变量
      document.documentElement.style.setProperty('--app-bg-opacity', savedOpacity);
    }
  }, [backgroundImage, theme, localOpacity]);

  // 优化文件上传处理
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      window.showError && window.showError('请上传图片文件');
      return;
    }
    
    if (file.size > 3 * 1024 * 1024) {
      window.showError && window.showError('图片大小不能超过3MB');
      return;
    }
    
    // 显示加载指示器或预览占位符
    setCustomBgPreviewUrl('loading');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target.result;
      
      // 预加载图片
      const img = new Image();
      img.onload = () => {
        // 压缩大图片以提高性能
        if (img.width > 1920 || img.height > 1080) {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算新尺寸，保持宽高比
            let newWidth = img.width;
            let newHeight = img.height;
            
            if (newWidth > 1920) {
              newHeight = (newHeight * 1920) / newWidth;
              newWidth = 1920;
            }
            
            if (newHeight > 1080) {
              newWidth = (newWidth * 1080) / newHeight;
              newHeight = 1080;
            }
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // 绘制压缩后的图片
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            // 转换为jpg以减少文件大小
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            
            // 更新预览和状态
            setCustomBgPreviewUrl(compressedUrl);
            localStorage.setItem('customBackgroundImage', compressedUrl);
            onBackgroundImageChange(compressedUrl, opacity);
          } catch (err) {
            // 如果压缩失败，使用原始图片
            console.warn('Image compression failed:', err);
            setCustomBgPreviewUrl(imgUrl);
            localStorage.setItem('customBackgroundImage', imgUrl);
            onBackgroundImageChange(imgUrl, opacity);
          }
        } else {
          // 小图片不需要压缩
          setCustomBgPreviewUrl(imgUrl);
          localStorage.setItem('customBackgroundImage', imgUrl);
          onBackgroundImageChange(imgUrl, opacity);
        }
      };
      
      img.onerror = () => {
        // 处理加载错误
        window.showError && window.showError('图片加载失败，请尝试其他图片');
        setCustomBgPreviewUrl('');
      };
      
      img.src = imgUrl;
    };
    
    reader.readAsDataURL(file);
  }, [opacity, onBackgroundImageChange]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (opacityUpdateTimeoutRef.current) {
        clearTimeout(opacityUpdateTimeoutRef.current);
      }
    };
  }, []);



  // System info states
  const [systemInfo, setSystemInfo] = useState({
    platform: '检测中...',
    arch: '检测中...',
    version: '检测中...',
    osType: '检测中...',
    locale: '检测中...'
  });
  const [isLoadingSystemInfo, setIsLoadingSystemInfo] = useState(false);
  
  // Download directory states
  const [downloadDirectory, setDownloadDirectory] = useState('检测中...');
  const [isLoadingDownloadDir, setIsLoadingDownloadDir] = useState(false);

  // 获取系统信息的函数
  const fetchSystemInfo = async () => {
    setIsLoadingSystemInfo(true);
    try {
      const [platformInfo, archInfo, versionInfo, osTypeInfo, localeInfo] = await Promise.all([
        platform(),
        arch(),
        version(),
        osType(),
        locale()
      ]);
      
      setSystemInfo({
        platform: platformInfo || '未知',
        arch: archInfo || '未知',
        version: versionInfo || '未知',
        osType: osTypeInfo || '未知',
        locale: localeInfo || '未知'
      });
    } catch (error) {
      console.error('获取系统信息失败:', error);
      setSystemInfo({
        platform: '获取失败',
        arch: '获取失败',
        version: '获取失败',
        osType: '获取失败',
        locale: '获取失败'
      });
    } finally {
      setIsLoadingSystemInfo(false);
    }
  };
  
  // 获取下载目录的函数
  const fetchDownloadDirectory = async () => {
    setIsLoadingDownloadDir(true);
    try {
      const dir = await invoke('get_download_directory');
      setDownloadDirectory(dir || '未知');
    } catch (error) {
      console.error('获取下载目录失败:', error);
      setDownloadDirectory('获取失败');
    } finally {
      setIsLoadingDownloadDir(false);
    }
  };
  
  // 选择下载目录的函数
  const selectDownloadDirectory = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: '选择下载目录'
      });
      
      if (selectedPath) {
        await invoke('set_download_directory', { path: selectedPath });
        setDownloadDirectory(selectedPath);
        window.showSuccess && window.showSuccess('下载目录设置成功！');
      }
    } catch (error) {
      console.error('设置下载目录失败:', error);
      window.showError && window.showError('设置下载目录失败: ' + error);
    }
  };

  // 组件挂载时获取系统信息和下载目录
  useEffect(() => {
    fetchSystemInfo();
    fetchDownloadDirectory();
  }, []);

  const handleThemeChange = (value) => {
    if (onThemeChange) {
      onThemeChange(value);
    }
  };
  
  // 处理背景变更 - 将此函数提前到backgroundSelector之前定义
  const handleBackgroundChange = (backgroundId, url) => {
    // If it's the custom background
    if (backgroundId === 'custom') {
      // 使用当前opacity值
      onBackgroundImageChange(customBgPreviewUrl, opacity);
      return;
    }
    
    // 使用当前opacity值
    onBackgroundImageChange(url, opacity);
  };
  
  // 选择文件上传
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // 修复backgroundImage undefined错误 - 移动到组件内部
  const handleOpacityChange = useCallback((newOpacity) => {
    // 避免重复更新相同的值
    if (Math.abs(newOpacity - localOpacity) < 0.01) {
      return;
    }
    
    // 更新本地状态
    setLocalOpacity(newOpacity);
    setOpacity(newOpacity);
    
    // 立即更新localStorage，避免状态不一致
    localStorage.setItem('backgroundOpacity', newOpacity.toString());
    
    // 触发背景更新 - 确保传入正确的backgroundImage参数
    if (typeof onBackgroundImageChange === 'function') {
      onBackgroundImageChange(backgroundImage || '', newOpacity);
    }
  }, [backgroundImage, onBackgroundImageChange, localOpacity]);
  
  // 默认背景图片列表
  const DEFAULT_BACKGROUNDS = [
    { id: 'none', url: '', label: '无背景' },
    { id: 'bg1', url: 'https://cdn.pixabay.com/photo/2020/10/27/08/00/mountains-5689938_1280.png', label: '星空' },
    { id: 'bg2', url: 'https://cdn.pixabay.com/photo/2012/08/27/14/19/mountains-55067_1280.png', label: '山脉' },
    { id: 'bg3', url: 'https://cdn.pixabay.com/photo/2020/10/11/08/00/lighthouse-5645042_1280.png', label: '灯塔' },
  ];
  
  // 使用useMemo优化渲染复杂组件 - 移动到组件内部
  const backgroundSelector = useMemo(() => (
    <BackgroundPreviewContainer>
      {DEFAULT_BACKGROUNDS.map(bg => (
        <OptimizedBackgroundPreview 
          key={bg.id}
          imageUrl={bg.url}
          theme={theme}
          selected={backgroundImage === bg.url}
          label={bg.label}
          onClick={() => handleBackgroundChange(bg.id, bg.url)}
        />
      ))}
      <OptimizedBackgroundPreview
        isCustom={true}
        theme={theme}
        customImageUrl={customBgPreviewUrl}
        selected={backgroundImage === customBgPreviewUrl && customBgPreviewUrl}
        onClick={() => handleBackgroundChange('custom')}
        onUploadClick={handleUploadClick}
      >
        <UploadInput 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </OptimizedBackgroundPreview>
    </BackgroundPreviewContainer>
  ), [theme, backgroundImage, customBgPreviewUrl, handleBackgroundChange, handleFileChange, handleUploadClick]);
  
  // 优化滑块渲染 - 添加undefined检查
  const opacitySlider = useMemo(() => (
    backgroundImage && backgroundImage !== undefined && (
      <SliderContainer>
        <OptionLabel theme={theme}>{t('settings.opacity')}</OptionLabel>
        <FastSlider
          min={0.1}
          max={1}
          step={0.05}
          value={localOpacity}
          onChange={handleOpacityChange}
          theme={theme}
        />
      </SliderContainer>
    )
  ), [backgroundImage, localOpacity, theme, handleOpacityChange, t]);

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

  // 清除自定义背景
  const handleRemoveCustomBackground = () => {
    setCustomBgPreviewUrl('');
    localStorage.removeItem('customBackgroundImage');
    
    // 如果当前正在使用自定义背景，则重置为无背景
    if (backgroundImage === customBgPreviewUrl) {
      handleBackgroundChange('none', '');
    }
  };

  // 处理URL输入
  const handleUrlChange = (e) => {
    setCustomBgUrl(e.target.value);
  };

  // 通过URL加载图片
  const handleLoadUrlImage = () => {
    if (!customBgUrl) {
      window.showError && window.showError('请输入图片URL');
      return;
    }

    // 检查URL格式
    try {
      new URL(customBgUrl);
    } catch (e) {
      window.showError && window.showError('请输入有效的URL地址');
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
      window.showError && window.showError('无法加载图片，请检查URL是否正确');
    };
    img.src = customBgUrl;
  };



  // 在WebKit环境下，等待兼容性修复完成后再渲染
  if (isWebKit() && !isWebKitReady) {
    return (
      <SettingsContainer 
        theme={theme}
        data-settings-container
        isWebKit={isWebKit()}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '50vh',
          opacity: 0.7
        }}
      >
        <div style={{ 
          textAlign: 'center',
          color: 'var(--app-text-color)',
          fontSize: '16px'
        }}>
          {t('settings.loading') || '正在加载设置...'}
        </div>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer 
      theme={theme}
      data-settings-container
      isWebKit={isWebKit()}
    >
      <SettingsTitle theme={theme}>{t('settings.title') || '设置'}</SettingsTitle>
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>{t('settings.appearance') || '外观设置'}</SectionTitle>
        
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.theme') || '主题'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.themeDesc') || '选择应用的显示主题，影响整体界面颜色'}
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
              {t('settings.light') || '浅色'}
            </RadioLabel>
            <RadioLabel theme={theme} selected={theme === 'dark'}>
              <RadioInput
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={(e) => handleThemeChange(e.target.value)}
              />
              {t('settings.dark') || '深色'}
            </RadioLabel>
          </RadioGroup>
        </OptionGroup>
        
        {/* 视图模式设置 */}
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.viewMode') || '视图模式'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.viewModeDesc') || '选择应用内容的显示方式'}
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
          <OptionLabel theme={theme}>{t('settings.language') || '语言'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.languageDesc') || '选择应用界面语言'}
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
      
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>{t('settings.background') || '背景设置'}</SectionTitle>
        
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.background') || '背景图片'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.backgroundDesc') || '选择或上传自定义背景图片'}
          </OptionDescription>
          {backgroundSelector}
          
          <InputGroup>
            <Input 
              type="text"
              value={customBgUrl}
              onChange={handleUrlChange}
              placeholder={t('settings.backgroundURL') || '输入图片URL'}
              theme={theme}
            />
            <Button onClick={handleLoadUrlImage}>{t('settings.load') || '加载'}</Button>
          </InputGroup>
          
          {customBgPreviewUrl && (
            <Button 
              variant="danger" 
              onClick={handleRemoveCustomBackground}
              theme={theme}
            >
              {t('settings.removeCustomBackground') || '删除自定义背景'}
            </Button>
          )}
          
          {/* 透明度滑块 */}
          {opacitySlider}
        </OptionGroup>
      </SettingsSection>
      
      {/* Download Directory Section */}
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>{t('settings.downloadDirectory') || '下载设置'}</SectionTitle>
        
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.downloadPath') || '下载目录'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.downloadPathDesc') || '设置应用下载文件的保存位置'}
          </OptionDescription>
          
          <SystemInfoCard theme={theme} style={{ marginTop: '16px', marginBottom: '16px' }}>
            <SystemInfoLabel theme={theme}>{t('settings.currentDownloadPath') || '当前下载目录'}</SystemInfoLabel>
            <SystemInfoValue theme={theme}>{downloadDirectory}</SystemInfoValue>
          </SystemInfoCard>
          
          <Button 
            onClick={selectDownloadDirectory}
            disabled={isLoadingDownloadDir}
            theme={theme}
          >
            {isLoadingDownloadDir ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                {t('settings.loading') || '加载中...'}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                {t('settings.selectDownloadDirectory') || '选择下载目录'}
              </>
            )}
          </Button>
          
          <RefreshButton 
            theme={theme}
            onClick={fetchDownloadDirectory}
            disabled={isLoadingDownloadDir}
            style={{ marginTop: '12px' }}
          >
            {isLoadingDownloadDir ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                {t('settings.refreshing') || '刷新中...'}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                {t('settings.refreshDownloadDirectory') || '刷新下载目录'}
              </>
            )}
          </RefreshButton>
        </OptionGroup>
      </SettingsSection>

      {/* System Information Section */}
      <SettingsSection theme={theme}>
        <SectionTitle theme={theme}>{t('settings.systemInfo') || '系统信息'}</SectionTitle>
        
        <OptionGroup>
          <OptionLabel theme={theme}>{t('settings.systemInfoDesc') || '当前系统详细信息'}</OptionLabel>
          <OptionDescription theme={theme}>
            {t('settings.systemInfoDescription') || '查看当前运行环境的系统信息，包括操作系统、架构、版本等详细信息'}
          </OptionDescription>
          
          <SystemInfoGrid>
            <SystemInfoCard theme={theme}>
              <SystemInfoLabel theme={theme}>{t('settings.operatingSystem') || '操作系统'}</SystemInfoLabel>
              <SystemInfoValue theme={theme}>{systemInfo.platform}</SystemInfoValue>
            </SystemInfoCard>
            
            <SystemInfoCard theme={theme}>
              <SystemInfoLabel theme={theme}>{t('settings.systemArchitecture') || '系统架构'}</SystemInfoLabel>
              <SystemInfoValue theme={theme}>{systemInfo.arch}</SystemInfoValue>
            </SystemInfoCard>
            
            <SystemInfoCard theme={theme}>
              <SystemInfoLabel theme={theme}>{t('settings.systemVersion') || '系统版本'}</SystemInfoLabel>
              <SystemInfoValue theme={theme}>{systemInfo.version}</SystemInfoValue>
            </SystemInfoCard>
            
            <SystemInfoCard theme={theme}>
              <SystemInfoLabel theme={theme}>{t('settings.systemType') || '系统类型'}</SystemInfoLabel>
              <SystemInfoValue theme={theme}>{systemInfo.osType}</SystemInfoValue>
            </SystemInfoCard>
            
            <SystemInfoCard theme={theme}>
              <SystemInfoLabel theme={theme}>{t('settings.systemLanguage') || '系统语言'}</SystemInfoLabel>
              <SystemInfoValue theme={theme}>{systemInfo.locale}</SystemInfoValue>
            </SystemInfoCard>
          </SystemInfoGrid>
          
          <RefreshButton 
            theme={theme}
            onClick={fetchSystemInfo}
            disabled={isLoadingSystemInfo}
          >
            {isLoadingSystemInfo ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                {t('settings.refreshing') || '刷新中...'}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                {t('settings.refresh') || '刷新系统信息'}
              </>
            )}
          </RefreshButton>
        </OptionGroup>
      </SettingsSection>
    </SettingsContainer>
  );
});

// 添加默认值
Settings.defaultProps = {
  viewMode: 'grid',
  onViewModeChange: () => {},
  onLanguageChange: () => {}
};

export default Settings;