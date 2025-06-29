import React, { useState, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';

// 导入 Tauri API
import { save } from '@tauri-apps/api/dialog';
import { downloadDir } from '@tauri-apps/api/path';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import { createAcceleratedDownload, DownloadStatus } from '../services/acceleratedDownloader';

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

const DownloadStatusText = styled.div`
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
      const downloadId = Date.now();
      const newDownload = {
        id: downloadId,
        name: app.name,
        url: app.downloadUrl,
        progress: 0,
        status: 'pending',
        error: null,
        speed: '0 B/s',
        downloader: null,
      };

      setDownloads(prev => [...prev, newDownload]);

      try {
        const downloadsPath = await downloadDir();
        const filePath = await save({
          defaultPath: `${downloadsPath}/${app.name}`,
          filters: [{ name: 'All Files', extensions: ['*'] }],
        });

        if (!filePath) {
          setDownloads(prev => prev.filter(d => d.id !== downloadId));
          return;
        }

        const downloader = createAcceleratedDownload(
          app.downloadUrl,
          app.name,
          { useMultiThread: true },
          {
            onProgress: ({ progress, speed }) => {
              setDownloads(prev =>
                prev.map(d =>
                  d.id === downloadId ? { ...d, progress, speed } : d
                )
              );
            },
            onStatusChange: (status) => {
              setDownloads(prev =>
                prev.map(d => (d.id === downloadId ? { ...d, status } : d))
              );
            },
            onComplete: async (mergedData) => {
              try {
                await writeBinaryFile(filePath, mergedData);
                setDownloads(prev =>
                  prev.map(d =>
                    d.id === downloadId
                      ? { ...d, status: DownloadStatus.COMPLETED, progress: 100 }
                      : d
                  )
                );
              } catch (writeError) {
                console.error('File write error:', writeError);
                setDownloads(prev =>
                  prev.map(d =>
                    d.id === downloadId
                      ? { ...d, status: DownloadStatus.FAILED, error: writeError.message }
                      : d
                  )
                );
              }
            },
            onError: (error) => {
              console.error('Download error:', error);
              setDownloads(prev =>
                prev.map(d =>
                  d.id === downloadId
                    ? { ...d, status: DownloadStatus.FAILED, error: error.message }
                    : d
                )
              );
            },
          }
        );

        setDownloads(prev =>
          prev.map(d => (d.id === downloadId ? { ...d, downloader } : d))
        );

        downloader.start();

      } catch (error) {
        console.error('Setup error:', error);
        setDownloads(prev =>
          prev.map(d =>
            d.id === downloadId
              ? { ...d, status: DownloadStatus.FAILED, error: error.message }
              : d
          )
        );
      }
    },
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
                <DownloadStatusText status={download.status}>
                  {download.status} - {download.speed}
                </DownloadStatusText>
              </DownloadHeader>
              
              {download.status !== 'completed' && download.status !== 'error' && (
                <ProgressBar theme={theme}>
                  <Progress value={download.progress} />
                </ProgressBar>
              )}
              
              {download.status === 'failed' && (
                <>
                  <div style={{ color: '#FF3B30', fontSize: '12px', marginBottom: '8px' }}>
                    {download.error}
                  </div>
                  <Button onClick={() => retryDownload(download)}>
                    重试
                  </Button>
                </>
              )}
              
              {download.status !== 'completed' && download.status !== 'failed' && (
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