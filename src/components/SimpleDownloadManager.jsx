import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import styled from 'styled-components';
import { TauriDownloaderUtil, isAcceleratedDownloadEnabled, toggleAcceleratedDownload } from './TauriDownloader';
import { useTranslation } from 'react-i18next';
import { processDownloadedFile } from '../services/fileProcessor';

const Container = styled.div`
  width: 100%;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
`;

const Header = styled.div`
  padding: 16px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const Title = styled.div`
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const DownloadsList = styled.div`
  max-height: 600px;
  overflow-y: auto;
  padding: 16px;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f0f0f0'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 14px;
`;

const DownloadItem = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const DownloadName = styled.div`
  font-weight: 500;
  margin-bottom: 8px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const DownloadStatus = styled.div`
  font-size: 12px;
  margin-bottom: 8px;
  color: ${props => {
    switch (props.status) {
      case 'completed': return '#34C759';
      case 'error': return '#FF3B30';
      case 'downloading': return props.theme === 'dark' ? '#4CADEB' : '#0066CC';
      default: return props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f';
    }
  }};
`;

const ProgressBar = styled.div`
  height: 4px;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
  border-radius: 2px;
  margin: 8px 0;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background-color: #0066CC;
`;

const SpeedLabel = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#4CADEB' : '#0066CC'};
  margin-left: 8px;
`;

const ButtonContainer = styled.div`
  display: flex;
  padding: 8px 16px;
  justify-content: space-between;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const Button = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  background-color: ${props => props.variant === 'danger' ? '#FF3B30' : '#0066CC'};
  color: white;
  
  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const SimpleDownloadManager = forwardRef(({ theme }, ref) => {
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState([]);
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [completedDownloads, setCompletedDownloads] = useState([]);
  const [autoRun, setAutoRun] = useState(() => {
    return localStorage.getItem('autoRunDownloads') === 'true';
  });
  const [autoExtract, setAutoExtract] = useState(() => {
    return localStorage.getItem('autoExtractDownloads') === 'true';
  });
  const [acceleratedDownload, setAcceleratedDownload] = useState(() => {
    return isAcceleratedDownloadEnabled();
  });
  const [currentSpeed, setCurrentSpeed] = useState('');
  const downloadsContainerRef = React.useRef(null);
  
  // Sync with localStorage when settings change
  useEffect(() => {
    const autoRunValue = localStorage.getItem('autoRunDownloads');
    if (autoRunValue !== null && autoRunValue !== autoRun.toString()) {
      setAutoRun(autoRunValue === 'true');
    }
  }, [autoRun]);
  
  useEffect(() => {
    const autoExtractValue = localStorage.getItem('autoExtractDownloads');
    if (autoExtractValue !== null && autoExtractValue !== autoExtract.toString()) {
      setAutoExtract(autoExtractValue === 'true');
    }
  }, [autoExtract]);
  
  useEffect(() => {
    const acceleratedValue = isAcceleratedDownloadEnabled();
    if (acceleratedValue !== acceleratedDownload) {
      setAcceleratedDownload(acceleratedValue);
    }
  }, [acceleratedDownload]);
  
  // 监听下载进度事件
  useEffect(() => {
    const handleDownloadProgress = (data) => {
      if (data && data.id) {
        setDownloads(prev => 
          prev.map(download => 
            download.id === data.id ? 
            { 
              ...download, 
              progress: data.progress || 0,
              speed: data.speed || download.speed
            } : 
            download
          )
        );
        
        if (data.progress && data.progress.speed) {
          setCurrentSpeed(data.progress.speed);
        }
      }
    };
    
    TauriDownloaderUtil.addDownloadListener('onProgress', handleDownloadProgress);
    
    return () => {
      TauriDownloaderUtil.removeDownloadListener('onProgress', handleDownloadProgress);
    };
  }, []);
  
  // 处理下载完成的文件
  const handleFileProcessing = async (download) => {
    // 如果未启用自动运行和自动解压，则跳过处理
    if (!autoRun && !autoExtract) return;
    
    try {
      const result = await processDownloadedFile(
        download, 
        { autoRun, autoExtract }
      );
    } catch (error) {
      console.error(`处理文件失败: ${error.message}`);
    }
  };
  
  // 设置下载事件监听器
  useEffect(() => {
    const handleDownloadStart = (download) => {
      const newDownload = {
        ...download,
        progress: 0,
        speed: '0 KB/s',
        status: 'downloading',
        startTime: new Date()
      };
      
      setDownloads(prev => [...prev, newDownload]);
      setActiveDownloads(prev => [...prev, newDownload]);
    };
    
    const handleDownloadComplete = async (download) => {
      const completedDownload = {
        ...download,
        progress: 100,
        status: 'completed',
        endTime: new Date()
      };
      
      setDownloads(prev => 
        prev.map(d => d.id === download.id ? completedDownload : d)
      );
      
      setActiveDownloads(prev => prev.filter(d => d.id !== download.id));
      setCompletedDownloads(prev => [...prev, completedDownload]);
      
      // 处理下载完成的文件
      await handleFileProcessing(completedDownload);
    };
    
    const handleDownloadError = (data) => {
      const { download, error } = data;
      
      const errorDownload = {
        ...download,
        status: 'error',
        error: error.message || '下载失败',
        endTime: new Date()
      };
      
      setDownloads(prev => 
        prev.map(d => d.id === download.id ? errorDownload : d)
      );
      
      setActiveDownloads(prev => prev.filter(d => d.id !== download.id));
    };
    
    TauriDownloaderUtil.addDownloadListener('onStart', handleDownloadStart);
    TauriDownloaderUtil.addDownloadListener('onComplete', handleDownloadComplete);
    TauriDownloaderUtil.addDownloadListener('onError', handleDownloadError);
    
    return () => {
      TauriDownloaderUtil.removeDownloadListener('onStart', handleDownloadStart);
      TauriDownloaderUtil.removeDownloadListener('onComplete', handleDownloadComplete);
      TauriDownloaderUtil.removeDownloadListener('onError', handleDownloadError);
    };
  }, [autoRun, autoExtract, handleFileProcessing]);
  
  // 导出供父组件调用的方法
  useImperativeHandle(ref, () => ({
    startDownload: (app) => {
      TauriDownloaderUtil.download(app.downloadUrl, app.name);
    }
  }));
  
  const clearCompleted = () => {
    setDownloads(prev => prev.filter(download => download.status !== 'completed'));
    setCompletedDownloads([]);
  };

  // 渲染下载列表
  return (
    <Container theme={theme}>
      <Header theme={theme}>
        <Title theme={theme}>
          {t('downloadManager.title') || '下载管理'}
          {activeDownloads.length > 0 && 
            ` (${activeDownloads.length} ${t('downloadManager.downloadsInProgress') || '个下载进行中'})`
          }
        </Title>
        {currentSpeed && <SpeedLabel theme={theme}>{currentSpeed}</SpeedLabel>}
      </Header>
      
      <DownloadsList theme={theme} ref={downloadsContainerRef}>
        {downloads.length === 0 ? (
          <EmptyState theme={theme}>
            {t('downloadManager.noDownloads') || '暂无下载项目'}
          </EmptyState>
        ) : (
          downloads.map(download => (
            <DownloadItem key={download.id} theme={theme}>
              <DownloadName theme={theme}>{download.name}</DownloadName>
              <DownloadStatus theme={theme} status={download.status}>
                {download.status === 'downloading' && '下载中...'}
                {download.status === 'completed' && '下载完成'}
                {download.status === 'error' && `下载失败: ${download.error}`}
              </DownloadStatus>
              
              {download.status === 'downloading' && (
                <>
                  <ProgressBar theme={theme}>
                    <Progress progress={download.progress || 0} />
                  </ProgressBar>
                  <div>{download.progress?.toFixed(1) || 0}% - {download.speed}</div>
                </>
              )}
              
              {download.status === 'completed' && (
                <div>完成于: {formatTime(download.endTime)}</div>
              )}
            </DownloadItem>
          ))
        )}
      </DownloadsList>
      
      <ButtonContainer>
        {completedDownloads.length > 0 && (
          <Button onClick={clearCompleted}>
            {t('downloadManager.clearCompleted') || '清除已完成'}
          </Button>
        )}
      </ButtonContainer>
    </Container>
  );
});

export default SimpleDownloadManager;
