import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { listen } from '@tauri-apps/api/event';
import { formatBytes, formatProgress, calculatePercentage, formatSpeed, calculateETA } from '../utils/format';

// 进度容器
const ProgressContainer = styled.div`
  background: ${props => props.theme === 'dark' ? 'rgba(42, 42, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  transition: all 0.3s ease;
`;

// 下载信息头部
const DownloadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

// 文件名
const FileName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
`;

// 百分比显示
const PercentageText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#4CADEB' : '#0066CC'};
  min-width: 50px;
  text-align: right;
`;

// 进度条容器
const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme === 'dark' ? '#404040' : '#e8e8ed'};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
`;

// 进度条填充
const ProgressBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #0051D5);
  border-radius: 4px;
  width: ${props => props.$progress || 0}%;
  transition: width 0.3s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// 下载详情
const DownloadDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

// 文件大小信息
const SizeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// 速度和ETA信息
const SpeedInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// 状态指示器
const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'downloading': return '#34C759';
      case 'paused': return '#FF9500';
      case 'completed': return '#007AFF';
      case 'failed': return '#FF3B30';
      default: return '#999';
    }
  }};
  animation: ${props => props.$status === 'downloading' ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const DownloadProgress = ({ 
  taskId, 
  fileName, 
  theme = 'light', 
  onComplete, 
  onError,
  className 
}) => {
  const [downloadData, setDownloadData] = useState({
    downloadedSize: 0,
    totalSize: 0,
    progress: 0,
    speed: '0 B/s',
    status: 'pending'
  });
  
  const [isVisible, setIsVisible] = useState(true);

  // 处理下载进度更新
  const handleProgressUpdate = useCallback((event) => {
    const task = event.payload;
    
    // 只处理匹配的任务ID
    if (task.id !== taskId) return;
    
    setDownloadData({
      downloadedSize: task.downloaded_size || 0,
      totalSize: task.total_size || 0,
      progress: task.progress || 0,
      speed: task.speed || '0 B/s',
      status: task.status || 'pending'
    });
    
    // 如果下载完成，触发回调
    if (task.status === 'Completed' && onComplete) {
      onComplete(task);
    }
    
    // 如果下载失败，触发错误回调
    if (task.status === 'Failed' && onError) {
      onError(task);
    }
  }, [taskId, onComplete, onError]);

  // 设置事件监听器
  useEffect(() => {
    let unlistenProgress;
    
    const setupListeners = async () => {
      try {
        // 监听下载进度事件
        unlistenProgress = await listen('download_progress', handleProgressUpdate);
      } catch (error) {
        console.error('设置下载进度监听器失败:', error);
      }
    };
    
    setupListeners();
    
    // 清理函数
    return () => {
      if (unlistenProgress) {
        unlistenProgress();
      }
    };
  }, [handleProgressUpdate]);

  // 计算显示数据
  const percentage = calculatePercentage(downloadData.downloadedSize, downloadData.totalSize);
  const progressText = formatProgress(downloadData.downloadedSize, downloadData.totalSize);
  const eta = calculateETA(downloadData.totalSize, downloadData.downloadedSize, 
    parseFloat(downloadData.speed.replace(/[^0-9.]/g, '')) * 1024 * 1024); // 简化速度解析

  // 如果组件不可见，不渲染
  if (!isVisible) return null;

  return (
    <ProgressContainer theme={theme} className={className}>
      <DownloadHeader>
        <FileName theme={theme} title={fileName}>
          {fileName || '下载文件'}
        </FileName>
        <PercentageText theme={theme}>
          {percentage.toFixed(1)}%
        </PercentageText>
      </DownloadHeader>
      
      <ProgressBarContainer theme={theme}>
        <ProgressBarFill $progress={percentage} />
      </ProgressBarContainer>
      
      <DownloadDetails theme={theme}>
        <SizeInfo>
          <StatusIndicator $status={downloadData.status} />
          <span>{progressText}</span>
        </SizeInfo>
        
        <SpeedInfo>
          <span>{downloadData.speed}</span>
          {downloadData.status === 'downloading' && eta !== '计算中...' && (
            <span>• 剩余 {eta}</span>
          )}
        </SpeedInfo>
      </DownloadDetails>
    </ProgressContainer>
  );
};

export default DownloadProgress;