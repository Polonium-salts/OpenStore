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

const LogContainer = styled.div`
  max-height: 600px;
  overflow-y: auto;
  padding: 16px;
  font-family: monospace;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f0f0f0'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 14px;
`;

const LogEntry = styled.div`
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#e0e0e0'};
  color: ${props => {
    switch (props.type) {
      case 'info': return props.theme === 'dark' ? '#4CADEB' : '#0066CC';
      case 'success': return '#34C759';
      case 'error': return '#FF3B30';
      case 'warning': return '#FFCC00';
      default: return props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f';
    }
  }};
`;

const Timestamp = styled.span`
  color: ${props => props.theme === 'dark' ? '#777' : '#999'};
  margin-right: 8px;
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

const SpeedLabel = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#4CADEB' : '#0066CC'};
  margin-left: 8px;
`;

const SimpleDownloadManager = forwardRef(({ theme }, ref) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
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
  const logContainerRef = React.useRef(null);
  
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
  
  // 滚动到日志底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  // 添加日志条目
  const addLogEntry = (message, type = 'info') => {
    const timestamp = new Date();
    setLogs(prev => [...prev, { id: Date.now(), message, type, timestamp }]);
  };
  
  // 监听下载进度事件
  useEffect(() => {
    const handleDownloadProgress = (data) => {
      if (data.progress && data.progress.speed) {
        setCurrentSpeed(data.progress.speed);
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
    
    addLogEntry(`准备处理文件: ${download.name}`, 'info');
    
    try {
      const result = await processDownloadedFile(
        download, 
        { autoRun, autoExtract },
        (message, type) => addLogEntry(message, type)
      );
      
      if (result.success) {
        if (result.executed) {
          addLogEntry(`已自动运行: ${download.name}`, 'success');
        }
        
        if (result.extractPath) {
          addLogEntry(`已解压到: ${result.extractPath}`, 'success');
        }
      }
    } catch (error) {
      addLogEntry(`处理文件失败: ${error.message}`, 'error');
    }
  };
  
  // 设置下载事件监听器
  useEffect(() => {
    // 下载开始事件
    const handleDownloadStart = (download) => {
      // Check the current accelerated download setting
      const isAccelerated = isAcceleratedDownloadEnabled();
      setAcceleratedDownload(isAccelerated);
      
      addLogEntry(`开始下载: ${download.name}`, 'info');
      if (isAccelerated) {
        addLogEntry(`使用多线程加速下载，线程数: 8`, 'info');
      } else {
        addLogEntry(`使用标准单线程下载模式`, 'info');
      }
      
      setActiveDownloads(prev => [...prev, download.id]);
    };
    
    // 下载完成事件
    const handleDownloadComplete = async (download) => {
      setCurrentSpeed('');
      addLogEntry(`下载完成: ${download.name}`, 'success');
      setActiveDownloads(prev => prev.filter(id => id !== download.id));
      
      // 添加到已完成下载列表
      setCompletedDownloads(prev => [...prev, download]);
      
      // 处理下载完成的文件
      await handleFileProcessing(download);
    };
    
    // 下载错误事件
    const handleDownloadError = (data) => {
      setCurrentSpeed('');
      addLogEntry(`下载失败: ${data.download.name} - ${data.error?.message || '未知错误'}`, 'error');
      setActiveDownloads(prev => prev.filter(id => id !== data.download.id));
    };
    
    // 添加事件监听器
    TauriDownloaderUtil.addDownloadListener('onStart', handleDownloadStart);
    TauriDownloaderUtil.addDownloadListener('onComplete', handleDownloadComplete);
    TauriDownloaderUtil.addDownloadListener('onError', handleDownloadError);
    
    // 初始化日志
    addLogEntry(t('downloadManager.initialized') || '下载日志初始化完成', 'info');
    
    // 清理事件监听器
    return () => {
      TauriDownloaderUtil.removeDownloadListener('onStart', handleDownloadStart);
      TauriDownloaderUtil.removeDownloadListener('onComplete', handleDownloadComplete);
      TauriDownloaderUtil.removeDownloadListener('onError', handleDownloadError);
    };
  }, [autoRun, autoExtract, t]);
  
  useImperativeHandle(ref, () => ({
    startDownload: async (app) => {
      addLogEntry(`准备下载应用: ${app.name}`, 'info');
      
      try {
        // 检查下载URL
        if (!app.downloadUrl) {
          throw new Error('下载链接为空');
        }
        
        addLogEntry(`解析下载链接: ${app.downloadUrl}`, 'info');
        
        // 在开始下载前获取最新设置
        const isAccelerated = isAcceleratedDownloadEnabled();
        setAcceleratedDownload(isAccelerated);
        
        // 使用 TauriDownloaderUtil 进行下载
        if (isAccelerated) {
          addLogEntry(`启动多线程加速下载: ${app.name}`, 'info');
        } else {
          addLogEntry(`启动常规下载: ${app.name}`, 'info');
        }
        
        TauriDownloaderUtil.downloadFile(app.downloadUrl, app.name);
      } catch (error) {
        addLogEntry(`下载初始化失败: ${error.message}`, 'error');
      }
    }
  }));

  const clearLogs = () => {
    setLogs([]);
    addLogEntry(t('downloadManager.logsCleared') || '日志已清空', 'info');
  };

  return (
    <Container theme={theme}>
      <Header theme={theme}>
        <Title theme={theme}>
          {t('downloadManager.title') || '下载日志'} 
          {activeDownloads.length > 0 ? 
            ` (${activeDownloads.length} ${t('downloadManager.downloadsInProgress') || '个下载进行中'})` : 
            ''}
          {currentSpeed && <SpeedLabel theme={theme}>{currentSpeed}</SpeedLabel>}
        </Title>
      </Header>
      
      <LogContainer theme={theme} ref={logContainerRef}>
        {logs.length === 0 ? (
          <EmptyState theme={theme}>
            {t('downloadManager.noDownloads') || '暂无下载日志'}
          </EmptyState>
        ) : (
          logs.map(log => (
            <LogEntry key={log.id} type={log.type} theme={theme}>
              <Timestamp theme={theme}>[{formatTime(log.timestamp)}]</Timestamp>
              {log.message}
            </LogEntry>
          ))
        )}
      </LogContainer>
      
      <ButtonContainer theme={theme}>
        <Button 
          onClick={clearLogs} 
          variant="secondary"
          disabled={logs.length === 0}
        >
          {t('downloadManager.clearLogs') || '清空日志'}
        </Button>
        <span style={{ color: theme === 'dark' ? '#999' : '#666', fontSize: '12px' }}>
          {activeDownloads.length > 0 ? 
            `${activeDownloads.length} ${t('downloadManager.downloadsInProgress') || '个下载进行中'}` : 
            ''}
        </span>
      </ButtonContainer>
    </Container>
  );
});

export default SimpleDownloadManager;
