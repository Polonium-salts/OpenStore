import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const SelectorContainer = styled.div`
  margin-top: 24px;
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  border-radius: 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const SelectorTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const PlatformTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const PlatformTab = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.active ? '#0066CC' : (props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed')};
  background-color: ${props => props.active ? '#0066CC' : 'transparent'};
  color: ${props => props.active ? 'white' : (props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f')};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: ${props => props.active ? '#0066CC' : (props.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')};
  }
`;

const ArchOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const ArchOption = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.selected ? '#0066CC' : (props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed')};
  background-color: ${props => props.selected ? 'rgba(0, 102, 204, 0.1)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #0066CC;
    background-color: rgba(0, 102, 204, 0.05);
  }
`;

const ArchTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  margin-bottom: 4px;
`;

const ArchInfo = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DownloadInfo = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const InfoValue = styled.span`
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-weight: 500;
`;

const DownloadButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background-color: ${props => {
    switch(props.status) {
      case 'downloading': return '#FF9500';
      case 'paused': return '#34C759';
      case 'completed': return '#007AFF';
      case 'failed': return '#FF3B30';
      default: return '#0066CC';
    }
  }};
  color: white;
  margin-top: 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DownloadProgress = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  transition: width 0.3s ease;
  width: ${props => props.progress || 0}%;
`;

const ProgressText = styled.span`
  position: relative;
  z-index: 1;
  margin-left: 8px;
`;

const DownloadDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  border-radius: 8px;
  box-shadow: 0 4px 12px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
`;

const DropdownDownloadInfo = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  font-size: 14px;
  
  div {
    margin-bottom: 4px;
    color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const DownloadActions = styled.div`
  padding: 8px;
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: ${props => {
    switch(props.action) {
      case 'pause': return '#FF9500';
      case 'resume': return '#34C759';
      case 'open': return '#007AFF';
      default: return '#666';
    }
  }};
  color: white;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
`;

const SystemRequirement = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  background-color: ${props => props.theme === 'dark' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.1)'};
  border-radius: 6px;
  border-left: 3px solid #FFC107;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const RequirementLabel = styled.span`
  font-weight: 600;
  margin-right: 8px;
`;

const UnsupportedPlatform = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  background-color: ${props => props.theme === 'dark' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
  border-radius: 8px;
  border-left: 3px solid #dc3545;
  text-align: center;
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const UnsupportedIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
  color: #dc3545;
`;

const UnsupportedText = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const UnsupportedSubtext = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

// 平台图标组件
const PlatformIcon = ({ platform }) => {
  const icons = {
    windows: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.851"/>
      </svg>
    ),
    macos: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    linux: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 01-.088.066c-.297.168-.623.336-.985.328-.27-.005-.52-.12-.68-.334-.18-.238-.287-.503-.287-.84 0-.34.107-.604.287-.842.18-.239.42-.354.69-.354l.027-.002v.002zm-.025 1.963s.244.002.287.01c.043.008.075.037.094.1.025.088.043.199.069.307.051.169.113.477.069.692-.047.248-.267.269-.287.287-.067.067-.287.135-.436.135-.242 0-.35-.13-.398-.287-.025-.088-.063-.199-.063-.307 0-.169.038-.334.094-.508.069-.199.103-.31.11-.334.025-.088.051-.102.094-.135.05-.025.13-.051.287-.051v-.009h.016zm4.24.684c.083 0 .16.033.287.135.19.155.346.467.346.84 0 .467-.265.75-.41.840-.292.18-.543.17-.932.135-.63-.048-.936-.463-.936-.84 0-.199.051-.333.287-.465.19-.105.31-.135.438-.135.242 0 .35.048.92.49zm-.41 1.963c.242 0 .35.048.92.49.083 0 .16.033.287.135.19.155.346.467.346.84 0 .467-.265.75-.41.840-.292.18-.543.17-.932.135-.63-.048-.936-.463-.936-.84 0-.199.051-.333.287-.465.19-.105.31-.135.438-.135z"/>
      </svg>
    )
  };
  return icons[platform] || null;
};

// 获取架构显示名称
const getArchDisplayName = (arch) => {
  const names = {
    x64: 'x64 (64位)',
    x86: 'x86 (32位)',
    arm64: 'ARM64',
    universal: '通用版本',
    intel: 'Intel 芯片',
    apple_silicon: 'Apple Silicon (M1/M2)',
    x64_deb: 'DEB 包 (x64)',
    x64_rpm: 'RPM 包 (x64)',
    x64_tar: 'TAR 包 (x64)',
    arm64_deb: 'DEB 包 (ARM64)',
    arm64_rpm: 'RPM 包 (ARM64)',
    arm64_tar: 'TAR 包 (ARM64)'
  };
  return names[arch] || arch;
};

// 获取平台显示名称
const getPlatformDisplayName = (platform) => {
  const names = {
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux'
  };
  return names[platform] || platform;
};

const PlatformDownloadSelector = ({ app, theme, onDownload, getDownloadState, handleDownloadControl, getDownloadButtonText, formatFileSize }) => {
  const { t } = useTranslation();
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedArch, setSelectedArch] = useState('');
  const [selectedDownload, setSelectedDownload] = useState(null);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // 检查是否支持多平台下载
  const hasMultiPlatformDownloads = app.downloads && typeof app.downloads === 'object';
  
  // 如果不支持多平台下载，显示传统下载按钮
  if (!hasMultiPlatformDownloads) {
    return (
      <DownloadButton onClick={() => onDownload(app)} theme={theme}>
        下载
      </DownloadButton>
    );
  }

  const platforms = Object.keys(app.downloads);
  
  // 自动选择当前平台
  useEffect(() => {
    if (platforms.length > 0 && !selectedPlatform) {
      // 尝试检测当前平台
      const userAgent = navigator.userAgent.toLowerCase();
      let detectedPlatform = '';
      
      if (userAgent.includes('win')) {
        detectedPlatform = 'windows';
      } else if (userAgent.includes('mac')) {
        detectedPlatform = 'macos';
      } else if (userAgent.includes('linux')) {
        detectedPlatform = 'linux';
      }
      
      // 如果检测到的平台在可用平台中，则选择它，否则选择第一个
      const platformToSelect = platforms.includes(detectedPlatform) ? detectedPlatform : platforms[0];
      setSelectedPlatform(platformToSelect);
    }
  }, [platforms, selectedPlatform]);

  // 当平台改变时，自动选择第一个有效的架构
  useEffect(() => {
    if (selectedPlatform && app.downloads[selectedPlatform]) {
      const archs = Object.entries(app.downloads[selectedPlatform]);
      // 找到第一个有有效URL的架构
      const validArch = archs.find(([arch, downloadInfo]) => 
        downloadInfo.url && downloadInfo.url.trim() !== ''
      );
      
      if (validArch) {
        setSelectedArch(validArch[0]);
      } else {
        // 如果没有有效的架构，仍然选择第一个以显示不适配信息
        setSelectedArch(archs.length > 0 ? archs[0][0] : '');
      }
    }
  }, [selectedPlatform, app.downloads]);

  // 当架构改变时，更新选中的下载信息
  useEffect(() => {
    if (selectedPlatform && selectedArch && app.downloads[selectedPlatform]?.[selectedArch]) {
      const downloadInfo = app.downloads[selectedPlatform][selectedArch];
      // 检查是否有有效的下载URL
      if (downloadInfo.url && downloadInfo.url.trim() !== '') {
        setSelectedDownload(downloadInfo);
      } else {
        setSelectedDownload(null);
      }
    } else {
      setSelectedDownload(null);
    }
  }, [selectedPlatform, selectedArch, app.downloads]);

  // 检查当前选中的平台是否有任何有效的下载选项
  const hasValidDownloads = () => {
    if (!selectedPlatform || !app.downloads[selectedPlatform]) {
      return false;
    }
    
    return Object.values(app.downloads[selectedPlatform]).some(downloadInfo => 
      downloadInfo.url && downloadInfo.url.trim() !== ''
    );
  };

  // 检查特定架构是否有有效的下载URL
  const isArchSupported = (arch, downloadInfo) => {
    return downloadInfo.url && downloadInfo.url.trim() !== '';
  };

  const handleDownload = () => {
    if (selectedDownload) {
      // 创建一个包含选中下载信息的应用对象
      const downloadApp = {
        ...app,
        downloadUrl: selectedDownload.url,
        filename: selectedDownload.filename,
        size: selectedDownload.size,
        platform: selectedPlatform,
        architecture: selectedArch
      };
      onDownload(downloadApp);
    }
  };

  const handleOpenFile = (app) => {
    if (handleDownloadControl) {
      handleDownloadControl(app, 'open');
    }
  };

  // 获取下载状态
  const downloadState = getDownloadState ? getDownloadState(app.id) : { status: 'idle', progress: 0 };

  // 处理下载按钮点击
  const handleDownloadButtonClick = (e) => {
    e.stopPropagation();
    // 防止在过渡状态时重复点击
    if (downloadState.status === 'pausing' || downloadState.status === 'resuming') {
      return;
    }
    if (downloadState.status === 'completed') {
      handleOpenFile(app);
    } else if (downloadState.status === 'downloading') {
      handleDownloadControl && handleDownloadControl(app, 'pause');
    } else if (downloadState.status === 'paused') {
      handleDownloadControl && handleDownloadControl(app, 'resume');
    } else {
      handleDownload();
    }
  };

  // 切换下载详情显示
  const toggleDownloadDropdown = (e) => {
    e.stopPropagation();
    setShowDownloadDropdown(!showDownloadDropdown);
  };

  return (
    <SelectorContainer theme={theme}>
      <SelectorTitle theme={theme}>选择下载版本</SelectorTitle>
      
      {/* 平台选择 */}
      <PlatformTabs>
        {platforms.map(platform => (
          <PlatformTab
            key={platform}
            active={selectedPlatform === platform}
            theme={theme}
            onClick={() => setSelectedPlatform(platform)}
          >
            <PlatformIcon platform={platform} />
            {getPlatformDisplayName(platform)}
          </PlatformTab>
        ))}
      </PlatformTabs>

      {/* 架构选择 */}
      {selectedPlatform && app.downloads[selectedPlatform] && (
        <ArchOptions>
          {Object.entries(app.downloads[selectedPlatform]).map(([arch, downloadInfo]) => {
            const isSupported = isArchSupported(arch, downloadInfo);
            return (
              <ArchOption
                key={arch}
                selected={selectedArch === arch && isSupported}
                theme={theme}
                onClick={() => isSupported && setSelectedArch(arch)}
                style={{
                  opacity: isSupported ? 1 : 0.5,
                  cursor: isSupported ? 'pointer' : 'not-allowed',
                  borderColor: isSupported ? 
                    (selectedArch === arch ? '#0066CC' : (theme === 'dark' ? '#3a3a3d' : '#e8e8ed')) : 
                    '#dc3545'
                }}
              >
                <ArchTitle theme={theme}>
                  {getArchDisplayName(arch)}
                  {!isSupported && <span style={{ color: '#dc3545', marginLeft: '8px' }}>（不适配）</span>}
                </ArchTitle>
                <ArchInfo theme={theme}>
                  {isSupported ? (
                    <>
                      <span>{downloadInfo.size || '未知大小'}</span>
                      <span>{downloadInfo.filename || '未知文件名'}</span>
                    </>
                  ) : (
                    <span style={{ color: '#dc3545' }}>暂不支持此架构</span>
                  )}
                </ArchInfo>
              </ArchOption>
            );
          })}
        </ArchOptions>
      )}

      {/* 下载信息 */}
      {selectedDownload && (
        <DownloadInfo theme={theme}>
          <InfoRow>
            <InfoLabel theme={theme}>文件名:</InfoLabel>
            <InfoValue theme={theme}>{selectedDownload.filename}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel theme={theme}>文件大小:</InfoLabel>
            <InfoValue theme={theme}>{selectedDownload.size}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel theme={theme}>平台:</InfoLabel>
            <InfoValue theme={theme}>{getPlatformDisplayName(selectedPlatform)} ({getArchDisplayName(selectedArch)})</InfoValue>
          </InfoRow>
        </DownloadInfo>
      )}

      {/* 系统要求 */}
      {app.systemRequirements && selectedPlatform && app.systemRequirements[selectedPlatform] && (
        <SystemRequirement theme={theme}>
          <RequirementLabel>系统要求:</RequirementLabel>
          {app.systemRequirements[selectedPlatform]}
        </SystemRequirement>
      )}

      {/* 不适配提示 */}
      {selectedPlatform && !hasValidDownloads() && (
        <UnsupportedPlatform theme={theme}>
          <UnsupportedIcon>⚠️</UnsupportedIcon>
          <UnsupportedText>该系统暂不适配</UnsupportedText>
          <UnsupportedSubtext>
            {getPlatformDisplayName(selectedPlatform)} 系统的安装包暂未提供，请选择其他系统或等待后续更新
          </UnsupportedSubtext>
        </UnsupportedPlatform>
      )}

      {/* 下载按钮 */}
      <div style={{ position: 'relative' }}>
        <DownloadButton
          onClick={handleDownloadButtonClick}
          onContextMenu={downloadState.status !== 'idle' ? toggleDownloadDropdown : undefined}
          disabled={!selectedDownload || downloadState.status === 'pausing' || downloadState.status === 'resuming'}
          status={downloadState.status}
          theme={theme}
        >
          {downloadState.status === 'downloading' ? (
            <>
              <DownloadProgress progress={downloadState.progress} />
              <span>下载中</span>
              <ProgressText>{Math.round(downloadState.progress || 0)}%</ProgressText>
            </>
          ) : (
            getDownloadButtonText ? getDownloadButtonText(app.id) : 
            (selectedDownload ? `下载 (${selectedDownload.size})` : '暂无可用下载')
          )}
        </DownloadButton>
        
        {showDownloadDropdown && downloadState.status !== 'idle' && (
          <DownloadDropdown theme={theme}>
            <DropdownDownloadInfo theme={theme}>
              <div>{t('downloadManager.status')}: {t(`downloadManager.${downloadState.status}`)}</div>
              <div>{t('downloadManager.progress')}: {downloadState.progress}%</div>
              {downloadState.speed && formatFileSize && (
                <div>{t('downloadManager.speed')}: {formatFileSize(downloadState.speed)}/s</div>
              )}
              {downloadState.totalSize && formatFileSize && (
                <div>{t('downloadManager.size')}: {formatFileSize(downloadState.totalSize)}</div>
              )}
            </DropdownDownloadInfo>
            <DownloadActions>
              {downloadState.status === 'downloading' && (
                <ActionButton action="pause" onClick={() => handleDownloadControl && handleDownloadControl(app, 'pause')}>
                  {t('downloadManager.pause')}
                </ActionButton>
              )}
              {downloadState.status === 'paused' && (
                <ActionButton action="resume" onClick={() => handleDownloadControl && handleDownloadControl(app, 'resume')}>
                  {t('downloadManager.resume')}
                </ActionButton>
              )}
              {(downloadState.status === 'downloading' || downloadState.status === 'paused') && (
                <ActionButton onClick={() => handleDownloadControl && handleDownloadControl(app, 'cancel')}>
                  {t('downloadManager.cancel')}
                </ActionButton>
              )}
              {downloadState.status === 'completed' && (
                <ActionButton action="open" onClick={() => handleOpenFile(app)}>
                  {t('downloadManager.open')}
                </ActionButton>
              )}
            </DownloadActions>
          </DownloadDropdown>
        )}
      </div>
    </SelectorContainer>
  );
};

export default PlatformDownloadSelector;