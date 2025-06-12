import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { useTranslation } from 'react-i18next';
import { getNativeDownloadSettings } from '../utils/settingsUtil';
import { listen } from '@tauri-apps/api/event';

const Container = styled.div`
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 24px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
`;

const Card = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 10px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  margin-bottom: 24px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f5'};
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#4a4a4d' : '#eee'};
  font-weight: 600;
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : 'inherit'};
`;

const CardBody = styled.div`
  padding: 20px;
`;

const DownloadList = styled.div`
  margin-top: 16px;
`;

const DownloadItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#4a4a4d' : '#eee'};
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DownloadInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FileName = styled.div`
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 4px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : 'inherit'};
`;

const DownloadURL = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  word-break: break-all;
`;

const StatusBadge = styled.div`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
  
  ${props => {
    switch(props.status) {
      case 'pending':
        return `
          background-color: ${props.theme === 'dark' ? '#1b3553' : '#f0f8ff'};
          color: ${props.theme === 'dark' ? '#4b9eff' : '#0366d6'};
        `;
      case 'downloading':
        return `
          background-color: ${props.theme === 'dark' ? '#18344b' : '#e6f7ff'};
          color: ${props.theme === 'dark' ? '#4ba7ff' : '#1890ff'};
        `;
      case 'completed':
        return `
          background-color: ${props.theme === 'dark' ? '#1a3926' : '#f0fff0'};
          color: ${props.theme === 'dark' ? '#6dd45c' : '#52c41a'};
        `;
      case 'failed':
        return `
          background-color: ${props.theme === 'dark' ? '#461a1a' : '#fff0f0'};
          color: ${props.theme === 'dark' ? '#ff6b6b' : '#f5222d'};
        `;
      case 'paused':
        return `
          background-color: ${props.theme === 'dark' ? '#3a3a3d' : '#f5f5f5'};
          color: ${props.theme === 'dark' ? '#aaa' : '#666'};
        `;
      default:
        return `
          background-color: ${props.theme === 'dark' ? '#3a3a3d' : '#f5f5f5'};
          color: ${props.theme === 'dark' ? '#aaa' : '#666'};
        `;
    }
  }}
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f0f0f0'};
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.progress || 0}%;
    background-color: #4a86e8;
    transition: width 0.3s ease;
  }
`;

const DownloadPath = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#888'};
  margin-top: 4px;
`;

const StatusText = styled.div`
  font-size: 13px;
  margin-top: 4px;
  color: ${props => props.error ? (props.theme === 'dark' ? '#ff6b6b' : '#f5222d') : (props.theme === 'dark' ? '#aaa' : '#666')};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#999'};
  
  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;

const FileTypeIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  font-size: 16px;
  margin-right: 12px;
  background-color: ${props => {
    const colors = {
      dark: {
        pdf: '#d32f2f',
        image: '#7b1fa2',
        zip: '#e65100',
        text: '#388e3c',
        doc: '#1565c0',
        exe: '#e65100',
        default: '#616161'
      },
      light: {
        pdf: '#f5222d',
        image: '#722ed1',
        zip: '#faad14',
        text: '#52c41a',
        doc: '#1890ff',
        exe: '#fa8c16',
        default: '#8c8c8c'
      }
    };
    const themeColors = props.theme === 'dark' ? colors.dark : colors.light;
    
    switch(props.type) {
      case 'pdf': return themeColors.pdf;
      case 'image': return themeColors.image;
      case 'zip': return themeColors.zip;
      case 'text': return themeColors.text;
      case 'doc': return themeColors.doc;
      case 'exe': return themeColors.exe;
      default: return themeColors.default;
    }
  }};
  color: white;
`;

// 将 downloadFile 和事件监听器函数简单实现在当前文件中
const listeners = {
  onStart: [],
  onComplete: [],
  onError: [],
  onProgress: [],
  onPause: [],
  onResume: []
};

const addDownloadListener = (event, callback) => {
  if (listeners[event]) {
    listeners[event].push(callback);
  }
};

const removeDownloadListener = (event, callback) => {
  if (listeners[event]) {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }
};

const triggerEvent = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in ${event} listener:`, e);
      }
    });
  }
};

const downloadFile = async (url, fileName, savePath = null, appInfo = null, previousProgress = null) => {
  let downloadStartTime = Date.now();
  let isPaused = false;
  let pauseResolve = null;
  let downloadController = new AbortController();
  
  // 初始化下载进度状态，如果是恢复下载则使用之前的进度
  const downloadState = {
    id: Date.now(),
    url,
    fileName,
    savePath,
    appInfo,
    startTime: downloadStartTime,
    status: 'downloading',
    progress: previousProgress ? previousProgress.progress : 0,
    downloadedSize: previousProgress ? previousProgress.downloadedSize : 0,
    totalSize: previousProgress ? previousProgress.totalSize : 0,
    speed: 0,
    remainingTime: 0,
    lastUpdated: downloadStartTime,
    isResumed: !!previousProgress,
    previouslyDownloaded: previousProgress ? previousProgress.previouslyDownloaded : false
  };
  
  const pausePromise = new Promise(resolve => {
    pauseResolve = resolve;
  });
  
  const handlePause = (data) => {
    if (data.id === downloadState.id) {
      isPaused = true;
      downloadController.abort('download_paused');
      if (pauseResolve) pauseResolve('paused');
    }
  };
  
  addDownloadListener('onPause', handlePause);
  
  try {
    // 处理文件扩展名
    if (fileName && !fileName.includes('.')) {
      if (url.includes('.exe') || url.toLowerCase().includes('windows')) {
        fileName += '.exe';
      } else if (url.includes('.dmg') || url.toLowerCase().includes('macos')) {
        fileName += '.dmg';
      } else if (url.includes('.apk')) {
        fileName += '.apk';
      } else if (url.includes('.zip')) {
        fileName += '.zip';
      } else if (url.includes('.msi')) {
        fileName += '.msi';
      } else {
        fileName += '.exe';
      }
    }
    
    downloadState.fileName = fileName;
    
    // 确定保存路径
    let finalSavePath = savePath;
    if (!finalSavePath) {
      const dataDir = await appDataDir();
      finalSavePath = `${dataDir}downloads/${fileName}`;
    } else if (!finalSavePath.endsWith(fileName)) {
      finalSavePath = finalSavePath.endsWith('/') || finalSavePath.endsWith('\\') 
        ? `${finalSavePath}${fileName}`
        : `${finalSavePath}/${fileName}`;
    }
    
    downloadState.savePath = finalSavePath;
    
    // 尝试在下载前获取文件大小
    try {
      const headRequest = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const contentLength = headRequest.headers.get('content-length');
      if (contentLength) {
        const fileSize = parseInt(contentLength, 10);
        if (!isNaN(fileSize) && fileSize > 0) {
          downloadState.totalSize = fileSize;
          console.log(`文件大小获取成功: ${formatFileSize(fileSize)}`);
        }
      }
    } catch (err) {
      console.log(`无法通过HEAD请求获取文件大小: ${err}`);
    }
    
    // 如果HEAD请求失败，使用默认预估值
    if (downloadState.totalSize <= 0) {
      downloadState.totalSize = 50 * 1024 * 1024; // 50MB默认大小
      console.log(`使用预估文件大小: ${formatFileSize(downloadState.totalSize)}`);
    }
    
    // 初始通知下载开始
    triggerEvent('onStart', downloadState);
    
    // 启动专用的下载进度监听器，确保接收所有进度更新
    const unlistenProgress = await listen('download-progress', (event) => {
      if (isPaused) return;
      
      const progress = event.payload;
      if (!progress || typeof progress.downloaded !== 'number' || typeof progress.total !== 'number') {
        return;
      }
      
      // 确保进度数据有效
      if (progress.total > 0 && progress.downloaded >= 0 && progress.downloaded <= progress.total) {
        const now = Date.now();
        const elapsedTime = now - downloadState.lastUpdated;
        
        // 避免过于频繁的更新 (至少100ms一次)
        if (elapsedTime < 100) return;
        
        const oldDownloaded = downloadState.downloadedSize;
        downloadState.downloadedSize = progress.downloaded;
        downloadState.totalSize = progress.total;
        
        // 计算进度百分比
        downloadState.progress = Math.min(99, Math.floor((progress.downloaded / progress.total) * 100));
        
        // 计算下载速度 (bytes/second) - 基于两次更新之间的差值
        const bytesDownloadedSinceLastUpdate = progress.downloaded - oldDownloaded;
        if (elapsedTime > 0 && bytesDownloadedSinceLastUpdate > 0) {
          const speedInThisInterval = (bytesDownloadedSinceLastUpdate / elapsedTime) * 1000;
          
          // 平滑速度计算 (加权平均)
          if (downloadState.speed > 0) {
            downloadState.speed = 0.7 * downloadState.speed + 0.3 * speedInThisInterval;
          } else {
            downloadState.speed = speedInThisInterval;
          }
        }
        
        // 计算剩余时间 (秒)
        const remainingBytes = progress.total - progress.downloaded;
        if (downloadState.speed > 0) {
          downloadState.remainingTime = remainingBytes / downloadState.speed;
        }
        
        downloadState.lastUpdated = now;
        downloadState.isRealProgress = true;
        
        console.log(`下载进度更新: ${formatFileSize(progress.downloaded)}/${formatFileSize(progress.total)} (${downloadState.progress}%) - 速度: ${formatSpeed(downloadState.speed)}`);
        
        // 触发进度更新事件
        triggerEvent('onProgress', {
          ...downloadState,
          status: 'downloading'
        });
      }
    });
    
    // 设置备用进度估算，以防Tauri事件不可靠
    const progressInterval = setInterval(() => {
      if (isPaused) return;
      
      const now = Date.now();
      const totalElapsedSeconds = (now - downloadStartTime) / 1000;
      
      // 只有在没有收到实际进度更新时才使用估算
      const timeSinceLastUpdate = now - downloadState.lastUpdated;
      
      if (timeSinceLastUpdate > 2000 && !downloadState.isRealProgress && totalElapsedSeconds > 0) {
        // 使用估算进度，对于恢复的下载要考虑之前的进度
        let estimatedProgress;
        
        if (downloadState.isResumed && downloadState.progress > 0) {
          // 恢复下载时，从当前进度开始，缓慢增加
          estimatedProgress = Math.min(
            95, // 最多95%
            downloadState.progress + (Math.sqrt(totalElapsedSeconds) * 2) // 较缓慢的增加曲线
          );
        } else {
          // 新下载时使用标准估算
          estimatedProgress = Math.min(
            85, // 最多85%
            Math.sqrt(totalElapsedSeconds) * 8 // 较缓慢的曲线
          );
        }
        
        // 确保进度不会后退
        if (estimatedProgress > downloadState.progress) {
          // 计算基于进度的下载大小
          let estimatedDownloadedSize;
          if (downloadState.isResumed && downloadState.downloadedSize > 0) {
            estimatedDownloadedSize = downloadState.downloadedSize + 
              ((estimatedProgress - downloadState.progress) / 100) * downloadState.totalSize;
          } else {
            estimatedDownloadedSize = Math.floor((estimatedProgress / 100) * downloadState.totalSize);
          }
          
          downloadState.progress = estimatedProgress;
          downloadState.downloadedSize = estimatedDownloadedSize;
          downloadState.speed = downloadState.downloadedSize / totalElapsedSeconds;
          
          const remainingBytes = downloadState.totalSize - downloadState.downloadedSize;
          if (downloadState.speed > 0) {
            downloadState.remainingTime = remainingBytes / downloadState.speed;
          }
          
          downloadState.lastUpdated = now;
          downloadState.isEstimatedProgress = true;
          
          console.log(`使用估算进度: ${downloadState.progress}% - 速度: ${formatSpeed(downloadState.speed)}`);
          
          triggerEvent('onProgress', {
            ...downloadState,
            status: 'downloading'
          });
        }
      }
    }, 1000);
    
    console.log(`开始下载文件: ${url} 到 ${finalSavePath}`);
    
    let result = null;
    try {
      // 调用Tauri下载方法
      result = await Promise.race([
        pausePromise,
        invoke('download_file_with_progress', {
          url,
          savePath: finalSavePath,
          can_abort: true
        }).catch(err => {
          console.log('回退到标准下载方法:', err);
          return invoke('download_file', {
            url,
            savePath: finalSavePath
          });
        })
      ]);
      
      // 清理监听器
      if (unlistenProgress) {
        try {
          await unlistenProgress();
        } catch (e) {
          console.error('清理进度监听器失败:', e);
        }
      }
      
      // 处理暂停情况
      if (result === 'paused') {
        console.log('下载已暂停:', finalSavePath);
        
        return { 
          success: false, 
          paused: true,
          path: finalSavePath,
          progress: downloadState.progress,
          downloadedSize: downloadState.downloadedSize,
          totalSize: downloadState.totalSize,
          status: 'paused'
        };
      }
      
      // 处理成功情况
      if (result && result.success) {
        console.log(`下载成功: ${finalSavePath}`);
        
        // 获取文件的实际大小
        let finalFileSize = downloadState.totalSize;
        try {
          const fileMetadata = await invoke('get_file_metadata', { path: finalSavePath })
            .catch(() => ({ size: downloadState.totalSize }));
            
          if (fileMetadata && fileMetadata.size && fileMetadata.size > 0) {
            finalFileSize = fileMetadata.size;
          }
        } catch (e) {
          console.error('获取文件元数据失败:', e);
        }
        
        return { 
          success: true, 
          path: result.path || finalSavePath,
          fileSize: finalFileSize || result.fileSize || downloadState.totalSize,
          status: 'completed',
          progress: 100
        };
      } else {
        throw new Error(result?.message || 'Download failed');
      }
    } catch (downloadError) {
      // 处理下载被取消的情况
      if (downloadError.name === 'AbortError' || (downloadError.message && downloadError.message.includes('aborted'))) {
        console.log('下载被取消或暂停');
        return { 
          success: false, 
          paused: true,
          path: finalSavePath,
          progress: downloadState.progress,
          downloadedSize: downloadState.downloadedSize,
          totalSize: downloadState.totalSize,
          status: 'paused'
        };
      }
      
      console.error('下载过程中出现错误:', downloadError);
      
      // 检查文件是否实际已下载完成
      try {
        const fileExists = await invoke('verify_file_exists', { path: finalSavePath });
        if (fileExists) {
          console.log('尽管出现错误，但文件已成功下载:', finalSavePath);
          
          const fileMetadata = await invoke('get_file_metadata', { path: finalSavePath })
            .catch(() => ({ size: downloadState.totalSize }));
            
          const fileSize = fileMetadata.size || downloadState.totalSize;
          
          return { 
            success: true, 
            path: finalSavePath,
            fileSize: fileSize,
            status: 'completed',
            progress: 100
          };
        } else {
          throw downloadError;
        }
      } catch (verifyError) {
        console.error('验证文件存在时出错:', verifyError);
        throw downloadError;
      }
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      removeDownloadListener('onPause', handlePause);
    }
  } catch (error) {
    console.error('下载过程中发生异常:', error);
    
    return { 
      success: false, 
      error: error.toString(),
      status: 'failed'
    };
  }
};

const getFileType = (fileName) => {
  if (!fileName) return 'file';
  
  const extension = fileName.split('.').pop().toLowerCase();
  
  switch(extension) {
    case 'pdf': return 'pdf';
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return 'image';
    case 'zip': case 'rar': case '7z': return 'zip';
    case 'txt': case 'csv': case 'json': return 'text';
    case 'doc': case 'docx': case 'xls': case 'xlsx': case 'ppt': case 'pptx': return 'doc';
    case 'exe': case 'msi': return 'exe';
    default: return 'file';
  }
};

const FileIcon = ({ fileName, theme, appInfo }) => {
  // 首先验证appInfo是否是有效对象
  const hasValidAppInfo = appInfo && typeof appInfo === 'object';
  
  // 如果有应用信息且包含图标URL，则显示应用图标
  if (hasValidAppInfo && appInfo.icon) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        marginRight: '12px',
        overflow: 'hidden',
        borderRadius: '4px'
      }}>
        <img 
          src={appInfo.icon} 
          alt={appInfo.name || fileName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          onError={(e) => {
            console.warn('应用图标加载失败:', e);
            e.target.style.display = 'none';
            e.target.parentNode.innerText = appInfo.name ? appInfo.name[0].toUpperCase() : '?';
          }}
        />
      </div>
    );
  }
  
  // 如果有应用名称但没有图标，使用应用名首字母作为图标
  if (hasValidAppInfo && appInfo.name) {
    const firstLetter = appInfo.name.charAt(0).toUpperCase();
    const bgColor = stringToColor(appInfo.name);
    
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        marginRight: '12px',
        borderRadius: '4px',
        backgroundColor: bgColor,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px'
      }}>
        {firstLetter}
      </div>
    );
  }
  
  // 没有应用信息时，使用文件类型图标
  const type = getFileType(fileName);
  
  let icon = '📄';
  switch(type) {
    case 'pdf': icon = '📕'; break;
    case 'image': icon = '🖼️'; break;
    case 'zip': icon = '🗜️'; break;
    case 'text': icon = '📝'; break;
    case 'doc': icon = '📑'; break;
    case 'exe': icon = '⚙️'; break;
  }
  
  return (
    <FileTypeIcon type={type} theme={theme}>{icon}</FileTypeIcon>
  );
};

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#4285F4', // Google Blue
    '#EA4335', // Google Red
    '#FBBC05', // Google Yellow
    '#34A853', // Google Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#E91E63', // Pink
    '#3F51B5', // Indigo
  ];
  
  // 使用hash值选择一个颜色
  return colors[Math.abs(hash) % colors.length];
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '未知大小';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const getFileNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    let fileName = pathSegments[pathSegments.length - 1];
    
    const params = new URLSearchParams(urlObj.search);
    const fileNameFromParams = params.get('filename') || params.get('name') || params.get('file');
    if (fileNameFromParams) {
      fileName = fileNameFromParams;
    }
    
    fileName = decodeURIComponent(fileName);
    
    fileName = fileName.split('?')[0].split('#')[0];
    
    if (fileName && !fileName.includes('.') && url.includes('/download/')) {
      if (url.includes('.exe') || url.toLowerCase().includes('windows')) {
        fileName += '.exe';
      } else if (url.includes('.dmg') || url.toLowerCase().includes('macos') || url.toLowerCase().includes('mac')) {
        fileName += '.dmg';
      } else if (url.includes('.apk') || url.toLowerCase().includes('android')) {
        fileName += '.apk';
      } else if (url.includes('.zip') || url.includes('archive')) {
        fileName += '.zip';
      } else if (url.includes('.msi')) {
        fileName += '.msi';
      } else {
        fileName += '.exe';
      }
    }
    
    if (!fileName || fileName === '' || fileName === '/') {
      const timestamp = new Date().getTime();
      fileName = `download_${timestamp}.exe`;
    }
    
    return fileName;
  } catch (e) {
    console.error('无法从URL提取文件名:', e);
    const timestamp = new Date().getTime();
    return `download_${timestamp}.exe`;
  }
};

const saveDownloadList = (downloads) => {
  try {
    const storedDownloads = JSON.stringify(downloads);
    localStorage.setItem('downloadHistory', storedDownloads);
  } catch (error) {
    console.error('Failed to save download history:', error);
  }
};

const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds === Infinity || seconds < 0) return '剩余时间未知';
  
  seconds = Math.round(seconds);
  if (seconds < 60) return `${seconds}秒`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分${seconds % 60}秒`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}小时${minutes % 60}分`;
};

const formatSpeed = (bytesPerSecond) => {
  if (!bytesPerSecond || bytesPerSecond <= 0) return '0 KB/s';
  
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(2)} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
  }
};

const pauseDownload = (downloadId) => {
  if (!downloadId) return;
  
  console.log('暂停下载:', downloadId);
  triggerEvent('onPause', { id: downloadId });
};

const DownloadPage = ({ theme = 'light' }) => {
  const { t } = useTranslation();
  const [downloadList, setDownloadList] = useState([]);
  const [downloadSettings, setDownloadSettings] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const pendingDownloadProcessed = React.useRef(false);
  const activeDownloads = React.useRef(new Set());
  
  // Define startDownload first
  const startDownload = useCallback(async (url, fileName, downloadId, appInfo = null, previousProgress = null) => {
    try {
      // 改进防止重复下载的逻辑
      // 检查是否有相同URL或ID的下载任务已经在下载列表中
      const existingDownload = downloadList.find(d => 
        (d.url === url && (d.status === 'downloading' || d.status === 'pending')) || 
        (d.id === downloadId && (d.status === 'downloading' || d.status === 'pending'))
      );
      
      if (existingDownload) {
        console.log('下载已在进行中，跳过:', url);
        // 更新现有项而不是添加新项
        setDownloadList(prevList => {
          const updatedList = prevList.map(d => {
            if ((d.url === url && (d.status === 'downloading' || d.status === 'pending')) || d.id === downloadId) {
              return {
                ...d,
                appInfo: appInfo || d.appInfo // 保留应用信息或使用新的
              };
            }
            return d;
          });
          saveDownloadList(updatedList);
          return updatedList;
        });
        return;
      }
      
      // 从活跃集合中移除任何相同URL的旧下载
      if (activeDownloads.current.has(url)) {
        activeDownloads.current.delete(url);
      }
      
      // 记录活跃下载
      activeDownloads.current.add(url);
      
      // 防抖动时间范围，限制太频繁的更新
      const progressUpdateThrottleTime = 500; // 毫秒
      const lastProgressUpdate = { current: 0 };
      
      // 初始化下载项，如果是恢复下载，使用之前的进度信息
      const newDownload = {
        id: downloadId,
        url,
        fileName,
        status: 'pending',
        progress: previousProgress ? previousProgress.progress : 0,
        startTime: Date.now(),
        appInfo,
        downloadedSize: previousProgress ? previousProgress.downloadedSize : 0,
        totalSize: previousProgress ? previousProgress.totalSize : 0,
        speed: 0,
        remainingTime: 0,
        isResumed: !!previousProgress,
        previouslyDownloaded: previousProgress ? previousProgress.previouslyDownloaded : false,
        lastUpdated: Date.now()
      };
      
      // 移除具有相同URL的任何旧下载项
      setDownloadList(prevList => {
        const filteredList = prevList.filter(d => 
          !(d.url === url && (d.status === 'failed' || d.status === 'paused'))
        );
        
        const updatedList = [newDownload, ...filteredList];
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      // 处理文件扩展名
      let finalFileName = fileName;
      if (finalFileName && !finalFileName.includes('.')) {
        if (url.includes('.exe') || url.toLowerCase().includes('windows')) {
          finalFileName += '.exe';
        } else if (url.includes('.dmg') || url.toLowerCase().includes('macos')) {
          finalFileName += '.dmg';
        } else if (url.includes('.apk')) {
          finalFileName += '.apk';
        } else if (url.includes('.zip')) {
          finalFileName += '.zip';
        } else if (url.includes('.msi')) {
          finalFileName += '.msi';
        } else {
          finalFileName += '.exe';
        }
      }
      
      // 确定保存路径
      let savePath = null;
      if (downloadSettings && downloadSettings.downloadPath) {
        savePath = `${downloadSettings.downloadPath}/${finalFileName}`;
      } else {
        const dataDir = await appDataDir();
        savePath = `${dataDir}downloads/${finalFileName}`;
      }
      
      // 更新UI显示下载开始
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === downloadId ? { 
            ...d, 
            status: 'downloading', 
            savePath,
            fileName: finalFileName,
            progress: d.isResumed ? d.progress : 0,
            downloadedSize: d.isResumed ? d.downloadedSize : 0,
            totalSize: d.isResumed ? d.totalSize : 0,
            speed: 0,
            lastUpdated: Date.now()
          } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      // 设置进度监听
      const handleProgress = (progressData) => {
        // 确保只接收此下载的进度更新
        if (progressData.id === downloadId || 
            (progressData.url === url && (progressData.fileName === finalFileName || progressData.fileName === fileName))) {
          
          // 获取当前下载状态
          const currentDownload = downloadList.find(d => d.id === downloadId);
          if (!currentDownload) return; // 如果找不到下载项，不进行更新
          
          const isResumed = currentDownload.isResumed;
          const previouslyDownloaded = currentDownload.previouslyDownloaded;
          
          // 添加节流逻辑，避免过于频繁的更新
          const now = Date.now();
          if (lastProgressUpdate.current && (now - lastProgressUpdate.current < progressUpdateThrottleTime)) {
            // 如果距离上次更新时间太短，则忽略本次更新
            if (!progressData.downloadedSize ||
                !currentDownload.downloadedSize ||
                (progressData.downloadedSize - currentDownload.downloadedSize) < 102400) { // 除非下载增加了至少100KB
              return;
            }
          }
          
          // 标记此次更新时间
          lastProgressUpdate.current = now;
          
          // 验证进度数据有效性
          if (typeof progressData.totalSize === 'number' && progressData.totalSize > 0 && 
              typeof progressData.downloadedSize === 'number' && progressData.downloadedSize >= 0 && 
              progressData.downloadedSize <= progressData.totalSize) {
            
            console.log(`收到进度: ${formatFileSize(progressData.downloadedSize)}/${formatFileSize(progressData.totalSize)}`);
            
            // 对于恢复的下载，防止进度跳跃
            let effectiveProgress = { ...progressData };
            
            // 如果是恢复下载且有之前的进度数据
            if (isResumed && previouslyDownloaded) {
              // 确保下载进度不会回退
              if (progressData.downloadedSize < currentDownload.downloadedSize) {
                effectiveProgress.downloadedSize = currentDownload.downloadedSize;
              }
              
              // 确保总大小合理
              if (progressData.totalSize < currentDownload.totalSize) {
                effectiveProgress.totalSize = currentDownload.totalSize;
              }
            }
            
            // 更新下载列表中的进度
            setDownloadList(prevList => {
              const updatedList = prevList.map(d => {
                if (d.id === downloadId && (d.status === 'downloading' || d.status === 'pending')) {
                  // 计算正确的进度百分比，确保不超过99%
                  const progressPercent = Math.min(99, Math.floor((effectiveProgress.downloadedSize / effectiveProgress.totalSize) * 100));
                  
                  // 确保进度不会后退
                  const finalProgress = Math.max(progressPercent, d.progress || 0);
                  const finalDownloadedSize = Math.max(effectiveProgress.downloadedSize, d.downloadedSize || 0);
                  
                  return {
                    ...d,
                    status: 'downloading',
                    progress: finalProgress,
                    downloadedSize: finalDownloadedSize,
                    totalSize: effectiveProgress.totalSize,
                    speed: effectiveProgress.speed || d.speed,
                    remainingTime: effectiveProgress.remainingTime || d.remainingTime,
                    lastUpdated: now,
                    isRealProgress: true
                  };
                }
                return d;
              });
              
              // 只有当有实际更新时才保存
              if (JSON.stringify(updatedList) !== JSON.stringify(prevList)) {
                saveDownloadList(updatedList);
              }
              
              return updatedList;
            });
          }
        }
      };
      
      // 监听下载进度事件
      addDownloadListener('onProgress', handleProgress);
      
      // 开始下载
      console.log(`开始下载 ${url} 到 ${savePath}`);
      const result = await downloadFile(url, finalFileName, savePath, appInfo, previousProgress);
      
      // 移除进度监听
      removeDownloadListener('onProgress', handleProgress);
      
      // 处理下载结果
      if (result && result.success) {
        console.log(`下载完成: ${result.path}, 大小: ${formatFileSize(result.fileSize)}`);
        
        // 更新UI为完成状态
        setDownloadList(prevList => {
          const updatedList = prevList.map(d => 
            d.id === downloadId ? { 
              ...d, 
              status: 'completed', 
              progress: 100,
              path: result.path,
              fileSize: result.fileSize,
              downloadedSize: result.fileSize,
              totalSize: result.fileSize,
              completedTime: new Date()
            } : d
          );
          saveDownloadList(updatedList);
          return updatedList;
        });
        
        // 显示完成通知
        setToast({
          show: true,
          message: t('downloadManager.completed', '下载完成'),
          type: 'success'
        });
        
        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
        
        // 在完成时从活跃下载中移除
        activeDownloads.current.delete(url);
      } else {
        // 处理下载失败
        console.error('下载失败:', result ? result.error : '未知错误');
        
        // 更新UI为失败状态
        setDownloadList(prevList => {
          const updatedList = prevList.map(d => 
            d.id === downloadId ? { 
              ...d, 
              status: 'failed',
              error: result ? result.error : t('downloadManager.unknownError', '未知错误')
            } : d
          );
          saveDownloadList(updatedList);
          return updatedList;
        });
        
        // 显示失败通知
        setToast({
          show: true,
          message: t('downloadManager.failed', '下载失败'),
          type: 'error'
        });
        
        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
        
        // 在失败时从活跃下载中移除
        activeDownloads.current.delete(url);
      }
    } catch (error) {
      console.error('下载过程中发生异常:', error);
      
      // 更新UI为失败状态
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === downloadId ? { ...d, status: 'failed', error: error.toString() } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      // 显示错误通知
      setToast({
        show: true,
        message: t('downloadManager.failed', '下载失败'),
        type: 'error'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  }, [downloadSettings, downloadList, t]);
  
  // Define handleStartDownload after startDownload
  const handleStartDownload = useCallback(async (url, name, appInfo = null) => {
    if (!url) {
      setToast({
        show: true,
        message: t('downloadManager.urlRequired'),
        type: 'error'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      
      return;
    }

    const filename = name || getFileNameFromUrl(url);
    const downloadId = Date.now();
    
    // Check if this download is already in progress or completed
    const alreadyExists = downloadList.some(d => 
      d.url === url && 
      d.fileName === filename &&
      ['downloading', 'completed'].includes(d.status)
    );
    
    if (alreadyExists) {
      setToast({
        show: true,
        message: t('downloadManager.alreadyExists', '该文件已在下载列表中'),
        type: 'info'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      
      return;
    }
    
    // Also check active downloads ref to prevent duplicates
    if (activeDownloads.current.has(url)) {
      setToast({
        show: true,
        message: t('downloadManager.alreadyExists', '该文件已在下载列表中'),
        type: 'info'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      
      return;
    }
    
    startDownload(url, filename, downloadId, appInfo);
  }, [downloadList, t, startDownload]);
  
  // Load saved downloads
  useEffect(() => {
    try {
      const savedDownloads = localStorage.getItem('downloadHistory');
      if (savedDownloads) {
        setDownloadList(JSON.parse(savedDownloads));
      }
    } catch (error) {
      console.error('Failed to load download history:', error);
    }
  }, []);
  
  // Handle pending downloads in a separate useEffect
  useEffect(() => {
    // Only process once
    if (pendingDownloadProcessed.current) return;
    
    const pendingDownload = sessionStorage.getItem('pendingDownload');
    if (pendingDownload) {
      try {
        const downloadInfo = JSON.parse(pendingDownload);
        // Always remove the pending download immediately to prevent duplicate processing
        sessionStorage.removeItem('pendingDownload');
        pendingDownloadProcessed.current = true;
        
        // Verify we have the required information before starting download
        if (downloadInfo && downloadInfo.downloadUrl) {
          // Check if this download is already in progress or completed
          const alreadyExists = downloadList.some(d => 
            d.url === downloadInfo.downloadUrl && 
            (d.fileName === downloadInfo.fileName || getFileNameFromUrl(downloadInfo.downloadUrl) === d.fileName) &&
            ['downloading', 'completed'].includes(d.status)
          );
          
          if (!alreadyExists && !activeDownloads.current.has(downloadInfo.downloadUrl)) {
            setTimeout(() => {
              if (handleStartDownload) {
                handleStartDownload(
                  downloadInfo.downloadUrl, 
                  downloadInfo.fileName, 
                  downloadInfo.appInfo
                );
              }
            }, 500);
          } else {
            console.log('Download already exists, skipping:', downloadInfo.fileName);
          }
        } else {
          console.error('Invalid pending download info:', downloadInfo);
        }
      } catch (error) {
        console.error('Error processing pending download:', error);
        sessionStorage.removeItem('pendingDownload');
      }
    }
  }, [downloadList, handleStartDownload]);
  
  useEffect(() => {
    console.log('设置Tauri HTTP进度监听器');
    
    // 监听Tauri HTTP插件发送的下载进度事件
    const unlistenFn = listen('download-progress', (event) => {
      const progress = event.payload;
      
      // 验证进度数据有效性
      if (progress && 
          typeof progress.downloaded === 'number' && 
          typeof progress.total === 'number') {
        
        // 提取速度和预计剩余时间
        const speed = progress.speed || 0;
        const eta = progress.eta || 0;
        
        console.log(`接收HTTP进度: ${formatFileSize(progress.downloaded)}/${formatFileSize(progress.total)} - 速度: ${formatSpeed(speed)} - 剩余: ${formatTime(eta)}`);
        
        // 查找正在下载的任务
        setDownloadList(prevList => {
          // 如果没有活跃下载，不进行操作
          const activeDownloads = prevList.filter(d => d.status === 'downloading');
          if (activeDownloads.length === 0) return prevList;
          
          // 计算准确的进度百分比
          const progressPercent = Math.min(99, Math.floor((progress.downloaded / progress.total) * 100));
          
          // 如果只有一个下载任务，直接更新它，但确保进度不会回退
          if (activeDownloads.length === 1) {
            const download = activeDownloads[0];
            
            return prevList.map(d => {
              if (d.id === download.id) {
                // 确保进度和下载大小不会回退
                const finalProgress = Math.max(progressPercent, d.progress || 0);
                const finalDownloadedSize = Math.max(progress.downloaded, d.downloadedSize || 0);
                
                return {
                  ...d,
                  progress: finalProgress,
                  downloadedSize: finalDownloadedSize,
                  totalSize: progress.total,
                  speed: speed,
                  remainingTime: eta,
                  lastUpdated: Date.now(),
                  isRealProgress: true
                };
              }
              return d;
            });
          }
          
          // 多个下载任务时，为每个活跃下载应用相同的逻辑，确保进度不会回退
          return prevList.map(d => {
            if (d.status === 'downloading') {
              // 确保进度和下载大小不会回退
              const finalProgress = Math.max(progressPercent, d.progress || 0);
              const finalDownloadedSize = Math.max(progress.downloaded, d.downloadedSize || 0);
              
              return {
                ...d,
                progress: finalProgress,
                downloadedSize: finalDownloadedSize,
                totalSize: progress.total > d.totalSize ? progress.total : d.totalSize,
                speed: speed,
                remainingTime: eta,
                lastUpdated: Date.now(),
                isRealProgress: true
              };
            }
            return d;
          });
        });
      }
    });
    
    return () => {
      unlistenFn.then(unlisten => unlisten());
    };
  }, []);
  
  useEffect(() => {
    const initialize = async () => {
      const settings = await getNativeDownloadSettings();
      setDownloadSettings(settings);
    };
    
    initialize();
  }, []);
  
  const clearCompletedDownloads = () => {
    setDownloadList(prevList => 
      prevList.filter(d => d.status !== 'completed')
    );
    
    saveDownloadList(downloadList.filter(d => d.status !== 'completed'));
  };
  
  const retryDownload = useCallback(async (download) => {
    try {
      // Mark the download as pending in the UI
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === download.id ? { ...d, status: 'pending', error: null } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      // Create a new download ID to ensure a fresh download process
      const newDownloadId = Date.now();
      
      // Start a new download with the same file information
      await startDownload(download.url, download.fileName, newDownloadId, download.appInfo);
      
      // Remove the failed download from the list if the new one succeeds
      setDownloadList(prevList => {
        const updatedList = prevList.filter(d => d.id !== download.id);
        saveDownloadList(updatedList);
        return updatedList;
      });
    } catch (error) {
      console.error(t('downloadManager.failed'), error);
      
      // Restore the failed state if retry fails
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === download.id ? { 
            ...d, 
            status: 'failed', 
            error: error.toString() 
          } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      setToast({
        show: true,
        message: t('downloadManager.retryFailed', '重试下载失败'),
        type: 'error'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  }, [t, startDownload]);

  const clearFailedDownloads = useCallback(() => {
    setDownloadList(prevList => {
      const filteredList = prevList.filter(d => d.status !== 'failed');
      saveDownloadList(filteredList);
      return filteredList;
    });
    
    setToast({
      show: true,
      message: t('downloadManager.clearedFailed'),
      type: 'success'
    });
    
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  }, [t]);
  
  const clearPausedDownloads = useCallback(() => {
    setDownloadList(prevList => {
      const filteredList = prevList.filter(d => d.status !== 'paused');
      saveDownloadList(filteredList);
      return filteredList;
    });
    
    setToast({
      show: true,
      message: t('downloadManager.clearedPaused', '已清除所有暂停的下载'),
      type: 'success'
    });
    
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  }, [t]);
  
  const deleteDownload = useCallback((downloadId) => {
    setDownloadList(prevList => {
      const filteredList = prevList.filter(d => d.id !== downloadId);
      saveDownloadList(filteredList);
      return filteredList;
    });
    
    setToast({
      show: true,
      message: t('downloadManager.deleted', '下载任务已删除'),
      type: 'success'
    });
    
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  }, [t]);
  
  const handlePauseDownload = useCallback((download) => {
    try {
      // Mark the download as paused in the UI
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === download.id ? { ...d, status: 'paused' } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      // Trigger download pause event
      pauseDownload(download.id);
      
      // Show toast notification
      setToast({
        show: true,
        message: t('downloadManager.paused', '下载已暂停'),
        type: 'info'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Failed to pause download:', error);
    }
  }, [t]);
  
  const handleResumeDownload = useCallback(async (download) => {
    try {
      // 确保下载在暂停状态
      if (download.status !== 'paused') {
        console.log('只能恢复已暂停的下载, 当前状态:', download.status);
        return;
      }
      
      // 标记下载为挂起状态
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === download.id ? { ...d, status: 'pending' } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      // 创建新的下载ID确保下载流程是全新的
      const newDownloadId = Date.now();
      
      // 保存原始appInfo和下载进度信息以确保恢复时不会出现进度跳跃
      const originalAppInfo = download.appInfo;
      const previousProgress = {
        downloadedSize: download.downloadedSize || 0,
        totalSize: download.totalSize || 0,
        progress: download.progress || 0,
        previouslyDownloaded: true
      };
      
      // 移除旧的下载前开始一个新的
      setDownloadList(prevList => {
        const filteredList = prevList.filter(d => d.id !== download.id);
        saveDownloadList(filteredList);
        return filteredList;
      });
      
      // 开始一个新的下载，使用相同的文件信息和之前的进度状态
      await startDownload(
        download.url, 
        download.fileName, 
        newDownloadId, 
        originalAppInfo, 
        previousProgress
      );
      
      // 显示成功提示
      setToast({
        show: true,
        message: t('downloadManager.resuming', '正在继续下载'),
        type: 'info'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('恢复下载失败:', error);
      
      // 如果恢复失败，恢复暂停状态
      setDownloadList(prevList => {
        // 检查是否仍然需要恢复原始下载项
        const exists = prevList.some(d => d.id === download.id);
        if (!exists) {
          const updatedList = [...prevList, {...download, status: 'paused'}];
          saveDownloadList(updatedList);
          return updatedList;
        }
        return prevList;
      });
      
      setToast({
        show: true,
        message: t('downloadManager.resumeFailed', '恢复下载失败'),
        type: 'error'
      });
      
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    }
  }, [t, startDownload]);

  return (
    <Container theme={theme}>
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: toast.type === 'error' ? '#d32f2f' : 
                             toast.type === 'success' ? '#388e3c' : 
                             toast.type === 'warning' ? '#f57c00' : '#0066CC',
            color: 'white',
            borderRadius: '4px',
            zIndex: '9999',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            transition: 'opacity 0.3s ease',
          }}
        >
          {toast.message}
        </div>
      )}
      
      <Title theme={theme}>{t('downloadManager.pageTitle')}</Title>
      
      <Card theme={theme}>
        <CardHeader theme={theme}>
          <span>{t('downloadManager.downloadList')}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            {downloadList.some(d => d.status === 'failed') && (
              <button 
                onClick={clearFailedDownloads}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#ff6b6b' : '#d32f2f',
                  fontSize: '14px'
                }}
              >
                {t('downloadManager.clearFailed', '清除失败下载')}
              </button>
            )}
            {downloadList.some(d => d.status === 'paused') && (
              <button 
                onClick={clearPausedDownloads}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#ff9800' : '#f57c00',
                  fontSize: '14px'
                }}
              >
                {t('downloadManager.clearPaused', '清除已暂停下载')}
              </button>
            )}
            {downloadList.some(d => d.status === 'completed') && (
              <button 
                onClick={clearCompletedDownloads}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#aaa' : '#666',
                  fontSize: '14px'
                }}
              >
                {t('downloadManager.clearCompleted')}
              </button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {downloadList.length === 0 ? (
            <EmptyState theme={theme}>
              <div style={{ fontSize: '48px', opacity: 0.3 }}>📥</div>
              <p>{t('downloadManager.noDownloads')}</p>
            </EmptyState>
          ) : (
            <DownloadList>
              {downloadList.map((download) => (
                <DownloadItem key={download.id} theme={theme}>
                  <DownloadInfo>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FileIcon 
                        fileName={download.fileName} 
                        theme={theme} 
                        appInfo={download.appInfo}
                      />
                      <div>
                        <FileName theme={theme}>
                          {download.appInfo && download.appInfo.name ? download.appInfo.name : download.fileName}
                        </FileName>
                        <DownloadURL theme={theme}>{download.url}</DownloadURL>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '8px' }}>
                      <StatusBadge status={download.status} theme={theme}>
                        {download.status === 'pending' && t('downloadManager.pending')}
                        {download.status === 'downloading' && t('downloadManager.downloading')}
                        {download.status === 'completed' && t('downloadManager.completed')}
                        {download.status === 'failed' && t('downloadManager.failed')}
                        {download.status === 'paused' && t('downloadManager.paused', '已暂停')}
                      </StatusBadge>
                      
                      {download.status === 'downloading' && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '12px',
                          color: theme === 'dark' ? '#aaa' : '#666'
                        }}>
                          {download.progress ? `${Math.round(download.progress)}%` : '0%'}
                        </span>
                      )}
                    </div>
                    
                    {(download.status === 'downloading' || download.status === 'completed' || download.status === 'paused') && (
                      <div style={{ marginTop: '8px' }}>
                        <ProgressBar 
                          progress={download.progress || 0} 
                          theme={theme} 
                          paused={download.status === 'paused'} 
                        />
                        
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          marginTop: '4px',
                          fontSize: '12px',
                          color: theme === 'dark' ? '#aaa' : '#666'
                        }}>
                          {download.status === 'downloading' && (
                            <>
                              <div style={{ marginRight: '10px' }}>
                                <span>
                                  速度: {formatSpeed(download.speed || 0)}
                                </span>
                              </div>
                              <div>
                                <span>
                                  剩余: {formatTime(download.remainingTime || 0)}
                                </span>
                              </div>
                            </>
                          )}
                          
                          <div style={{ width: '100%', marginTop: '4px' }}>
                            <span>
                              {typeof download.downloadedSize !== 'undefined' && download.totalSize ? 
                                `${formatFileSize(download.downloadedSize)} / ${formatFileSize(download.totalSize)}` : 
                                '大小计算中...'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {download.path && (
                      <DownloadPath theme={theme}>{t('downloadManager.savePath')}: {download.path}</DownloadPath>
                    )}
                    
                    {download.error && (
                      <StatusText error theme={theme}>{download.error}</StatusText>
                    )}
                  </DownloadInfo>
                  
                  <div>
                    {download.status === 'downloading' && (
                      <button
                        onClick={() => handlePauseDownload(download)}
                        style={{
                          background: 'none',
                          border: `1px solid ${theme === 'dark' ? '#4a4a4d' : '#d9d9d9'}`,
                          borderRadius: '4px',
                          padding: '4px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: theme === 'dark' ? '#f5f5f7' : 'inherit',
                          marginBottom: '6px',
                          display: 'block'
                        }}
                      >
                        {t('downloadManager.pause', '暂停')}
                      </button>
                    )}
                    
                    {download.status === 'paused' && (
                      <>
                        <button
                          onClick={() => handleResumeDownload(download)}
                          style={{
                            background: 'none',
                            border: `1px solid ${theme === 'dark' ? '#4a4a4d' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: theme === 'dark' ? '#f5f5f7' : 'inherit',
                            marginBottom: '6px',
                            display: 'block'
                          }}
                        >
                          {t('downloadManager.resume', '继续')}
                        </button>
                        <button
                          onClick={() => deleteDownload(download.id)}
                          style={{
                            background: 'none',
                            border: `1px solid ${theme === 'dark' ? '#4a4a4d' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: theme === 'dark' ? '#ff6b6b' : '#d32f2f'
                          }}
                        >
                          {t('downloadManager.delete', '删除')}
                        </button>
                      </>
                    )}
                    
                    {download.status === 'failed' && (
                      <>
                        <button
                          onClick={() => retryDownload(download)}
                          style={{
                            background: 'none',
                            border: `1px solid ${theme === 'dark' ? '#4a4a4d' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: theme === 'dark' ? '#f5f5f7' : 'inherit',
                            marginBottom: '6px',
                            display: 'block'
                          }}
                        >
                          {t('common.retry')}
                        </button>
                        <button
                          onClick={() => deleteDownload(download.id)}
                          style={{
                            background: 'none',
                            border: `1px solid ${theme === 'dark' ? '#4a4a4d' : '#d9d9d9'}`,
                            borderRadius: '4px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: theme === 'dark' ? '#ff6b6b' : '#d32f2f'
                          }}
                        >
                          {t('downloadManager.delete', '删除')}
                        </button>
                      </>
                    )}
                    
                    {download.status === 'completed' && (
                      <button
                        onClick={() => deleteDownload(download.id)}
                        style={{
                          background: 'none',
                          border: `1px solid ${theme === 'dark' ? '#4a4a4d' : '#d9d9d9'}`,
                          borderRadius: '4px',
                          padding: '4px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: theme === 'dark' ? '#ff6b6b' : '#d32f2f'
                        }}
                      >
                        {t('downloadManager.delete', '删除')}
                      </button>
                    )}
                  </div>
                </DownloadItem>
              ))}
            </DownloadList>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default DownloadPage; 