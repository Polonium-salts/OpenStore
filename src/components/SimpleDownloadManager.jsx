import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import styled from 'styled-components';
import { TauriDownloaderUtil } from './TauriDownloader';

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

const DownloadList = styled.div`
  max-height: 600px;
  overflow-y: auto;
  padding: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 14px;
`;

const DownloadItem = styled.div`
  padding: 12px;
  border-radius: 6px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DownloadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const DownloadName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const DownloadStatus = styled.div`
  font-size: 12px;
  color: ${props => {
    switch (props.status) {
      case 'completed': return '#34C759';
      case 'error': return '#FF3B30';
      default: return props.theme === 'dark' ? '#999' : '#666';
    }
  }};
`;

const Button = styled.button`
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  background-color: ${props => props.variant === 'danger' ? '#FF3B30' : '#0066CC'};
  color: white;
  margin-top: 8px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const SimpleDownloadManager = forwardRef(({ theme }, ref) => {
  const [downloads, setDownloads] = useState([]);
  
  // 设置下载事件监听器
  useEffect(() => {
    // 下载开始事件
    const handleDownloadStart = (download) => {
      console.log('下载开始:', download.name);
      
      // 查找是否已存在该下载
      const existingDownload = downloads.find(d => d.id === download.id);
      if (existingDownload) {
        // 更新现有的下载状态
        setDownloads(prev => prev.map(d => 
          d.id === download.id ? { ...d, status: 'downloading' } : d
        ));
      }
    };
    
    // 下载完成事件
    const handleDownloadComplete = (download) => {
      console.log('下载完成:', download.name);
      
      setDownloads(prev => prev.map(d => 
        d.id === download.id ? { ...d, status: 'completed' } : d
      ));
    };
    
    // 下载错误事件
    const handleDownloadError = (data) => {
      console.error('下载错误:', data.download.name, data.error);
      
      setDownloads(prev => prev.map(d => 
        d.id === data.download.id ? { 
          ...d, 
          status: 'error', 
          error: data.error?.message || '下载失败' 
        } : d
      ));
    };
    
    // 添加事件监听器
    TauriDownloaderUtil.addDownloadListener('onStart', handleDownloadStart);
    TauriDownloaderUtil.addDownloadListener('onComplete', handleDownloadComplete);
    TauriDownloaderUtil.addDownloadListener('onError', handleDownloadError);
    
    // 清理事件监听器
    return () => {
      TauriDownloaderUtil.removeDownloadListener('onStart', handleDownloadStart);
      TauriDownloaderUtil.removeDownloadListener('onComplete', handleDownloadComplete);
      TauriDownloaderUtil.removeDownloadListener('onError', handleDownloadError);
    };
  }, [downloads]);
  
  useImperativeHandle(ref, () => ({
    startDownload: async (app) => {
      console.log('开始下载应用:', app.name, app.downloadUrl);
      
      // 创建一个下载记录
      const downloadId = Date.now();
      const newDownload = {
        id: downloadId,
        name: app.name,
        url: app.downloadUrl,
        status: 'starting',
        error: null
      };
      
      setDownloads(prev => [...prev, newDownload]);
      
      try {
        // 使用 TauriDownloaderUtil 进行下载
        console.log('使用Tauri WebView下载:', app.name);
        TauriDownloaderUtil.downloadFile(app.downloadUrl, app.name);
      } catch (error) {
        console.error('下载错误:', error);
        setDownloads(prev => prev.map(d => 
          d.id === downloadId ? { ...d, status: 'error', error: error.message } : d
        ));
      }
    }
  }));

  const removeDownload = (downloadId) => {
    setDownloads(prev => prev.filter(d => d.id !== downloadId));
  };

  const retryDownload = (download) => {
    ref.current.startDownload({ name: download.name, downloadUrl: download.url });
    removeDownload(download.id);
  };

  return (
    <Container theme={theme}>
      <Header theme={theme}>
        <Title theme={theme}>下载管理器 ({downloads.length})</Title>
      </Header>
      
      <DownloadList>
        {downloads.length === 0 ? (
          <EmptyState theme={theme}>
            暂无下载任务
          </EmptyState>
        ) : (
          downloads.map(download => (
            <DownloadItem key={download.id} theme={theme}>
              <DownloadHeader>
                <DownloadName theme={theme}>{download.name}</DownloadName>
                <DownloadStatus theme={theme} status={download.status}>
                  {download.status === 'starting' ? '准备中' :
                   download.status === 'downloading' ? '下载中' :
                   download.status === 'completed' ? '下载完成' :
                   '下载失败'}
                </DownloadStatus>
              </DownloadHeader>
              
              {download.status === 'error' && (
                <>
                  <div style={{ color: '#FF3B30', fontSize: '12px', marginBottom: '8px' }}>
                    {download.error}
                  </div>
                  <Button onClick={() => retryDownload(download)}>
                    重试
                  </Button>
                </>
              )}
              
              <Button 
                variant={download.status === 'error' ? 'danger' : undefined} 
                onClick={() => removeDownload(download.id)}
              >
                {download.status === 'error' ? '删除' : '关闭'}
              </Button>
            </DownloadItem>
          ))
        )}
      </DownloadList>
    </Container>
  );
});

export default SimpleDownloadManager;
