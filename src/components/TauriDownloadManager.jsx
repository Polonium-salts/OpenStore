import React, { useState, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';

// 导入 Tauri API
import { save } from '@tauri-apps/api/dialog';
import { downloadDir } from '@tauri-apps/api/path';
import { writeBinaryFile } from '@tauri-apps/api/fs';

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

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  border-radius: 2px;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  background-color: #0066CC;
  width: ${props => props.value}%;
  transition: width 0.3s ease;
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

const TauriDownloadManager = forwardRef(({ theme }, ref) => {
  const [downloads, setDownloads] = useState([]);

  useImperativeHandle(ref, () => ({
    startDownload: async (app) => {
      const newDownload = {
        id: Date.now(),
        name: app.name,
        url: app.downloadUrl,
        progress: 0,
        status: 'downloading',
        error: null
      };

      setDownloads(prev => [...prev, newDownload]);

      try {
        // 获取下载目录路径
        const downloadsPath = await downloadDir();
        
        // 使用 Tauri 的 dialog API 让用户选择保存位置
        const filePath = await save({
          defaultPath: `${downloadsPath}/${app.name}`,
          filters: [{
            name: 'All Files',
            extensions: ['*']
          }]
        });
        
        if (!filePath) {
          // 用户取消了保存
          setDownloads(prev => prev.filter(d => d.id !== newDownload.id));
          return;
        }

        // 使用 fetch 获取内容并显示进度
        const response = await fetch(app.downloadUrl);
        
        if (!response.ok) {
          throw new Error(`下载失败: 状态码 ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = parseInt(contentLength, 10) || 0;
        let loaded = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          loaded += value.length;

          // 更新进度
          const progress = total ? Math.round((loaded / total) * 100) : Math.min(loaded / 1024 / 1024 * 5, 99); // 如果无法获取总大小，则估算进度
          setDownloads(prev => prev.map(d => 
            d.id === newDownload.id ? { ...d, progress } : d
          ));
        }

        // 将所有数据块合并成一个 Uint8Array
        let totalLength = 0;
        for (const chunk of chunks) {
          totalLength += chunk.length;
        }
        
        const mergedArray = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          mergedArray.set(chunk, offset);
          offset += chunk.length;
        }
        
        // 使用 Tauri 的 fs API 写入文件
        await writeBinaryFile(filePath, mergedArray);

        // 更新下载状态
        setDownloads(prev => prev.map(d => 
          d.id === newDownload.id ? { ...d, status: 'completed' } : d
        ));
      } catch (error) {
        console.error('下载错误:', error);
        setDownloads(prev => prev.map(d => 
          d.id === newDownload.id ? { ...d, status: 'error', error: error.message } : d
        ));
      }
    }
  }));

  const cancelDownload = (downloadId) => {
    setDownloads(prev => prev.filter(d => d.id !== downloadId));
  };

  const retryDownload = (download) => {
    cancelDownload(download.id);
    ref.current.startDownload({ name: download.name, downloadUrl: download.url });
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
                  {download.status === 'downloading' ? '下载中' :
                   download.status === 'completed' ? '已完成' :
                   '下载失败'}
                </DownloadStatus>
              </DownloadHeader>
              
              {download.status === 'downloading' && (
                <ProgressBar theme={theme}>
                  <Progress value={download.progress} />
                </ProgressBar>
              )}
              
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
              
              {download.status === 'downloading' && (
                <Button 
                  variant="danger" 
                  onClick={() => cancelDownload(download.id)}
                >
                  取消
                </Button>
              )}
            </DownloadItem>
          ))
        )}
      </DownloadList>
    </Container>
  );
});

export default TauriDownloadManager; 