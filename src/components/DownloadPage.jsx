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

const getFileSize = async (url) => {
  console.log(`尝试获取文件大小: ${url}`);
  
  try {
    // 先尝试使用HEAD请求获取Content-Length
    const headResponse = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (headResponse.ok) {
      const contentLength = headResponse.headers.get('content-length');
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (!isNaN(size) && size > 0) {
          console.log(`HEAD请求获取到文件大小: ${formatFileSize(size)}`);
          return size;
        }
      }
    }
    
    // 如果HEAD请求失败，尝试使用Range请求获取文件大小
    const rangeResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (rangeResponse.ok || rangeResponse.status === 206) {
      const contentRange = rangeResponse.headers.get('content-range');
      if (contentRange) {
        const match = contentRange.match(/bytes 0-0\/(\d+)/);
        if (match && match[1]) {
          const size = parseInt(match[1], 10);
          if (!isNaN(size) && size > 0) {
            console.log(`Range请求获取到文件大小: ${formatFileSize(size)}`);
            return size;
          }
        }
      }
    }
    
    // 尝试调用Tauri获取文件大小
    try {
      const result = await invoke('get_remote_file_size', { url })
        .catch(() => ({ size: 0 }));
      
      if (result && result.size && result.size > 0) {
        console.log(`Tauri API获取到文件大小: ${formatFileSize(result.size)}`);
        return result.size;
      }
    } catch (e) {
      console.log('Tauri API获取文件大小失败:', e);
    }
    
    console.log('无法获取准确的文件大小，尝试推断大小');
    
    // 尝试从URL或文件名推断文件大小
    const fileName = getFileNameFromUrl(url).toLowerCase();
    
    // 基于文件类型的估计大小
    if (fileName.endsWith('.exe') || fileName.endsWith('.msi')) {
      if (url.includes('chrome') || url.includes('browser')) {
        return 100 * 1024 * 1024; // Chrome浏览器约100MB
      } else if (url.includes('firefox')) {
        return 80 * 1024 * 1024; // Firefox约80MB
      } else if (url.includes('java') || url.includes('jdk') || url.includes('jre')) {
        return 150 * 1024 * 1024; // Java运行时约150MB
      } else {
        return 80 * 1024 * 1024; // 一般应用约80MB
      }
    } else if (fileName.endsWith('.dmg')) {
      return 200 * 1024 * 1024; // macOS应用约200MB
    } else if (fileName.endsWith('.apk')) {
      return 50 * 1024 * 1024; // Android应用约50MB
    } else if (fileName.endsWith('.zip') || fileName.endsWith('.7z') || fileName.endsWith('.rar')) {
      return 100 * 1024 * 1024; // 压缩文件约100MB
    } else if (fileName.endsWith('.iso')) {
      return 1024 * 1024 * 1024; // ISO镜像约1GB
    }
    
    // 未知文件类型的默认大小
    return 30 * 1024 * 1024; // 默认约30MB
  } catch (error) {
    console.error('获取文件大小时出错:', error);
    return 30 * 1024 * 1024; // 出错时使用30MB作为默认值
  }
};

const downloadFile = async (url, fileName, savePath = null, appInfo = null) => {
  let downloadStartTime = Date.now();
  let isPaused = false;
  let pauseResolve = null;
  let downloadController = new AbortController();
  
  // 初始化下载进度状态
  const downloadState = {
    id: Date.now(),
    url,
    fileName,
    savePath,
    appInfo,
    startTime: downloadStartTime,
    status: 'downloading',
    progress: 0,
    downloadedSize: 0,
    totalSize: 0,
    speed: 0,
    remainingTime: 0,
    lastUpdated: downloadStartTime
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
    // 获取文件大小
    const fileSize = await getFileSize(url);
    if (fileSize > 0) {
      downloadState.totalSize = fileSize;
      console.log(`设置文件大小: ${formatFileSize(fileSize)}`);
    }
    
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
        // 使用估算进度
        const estimatedProgress = Math.min(
          85, // 最多85%
          Math.sqrt(totalElapsedSeconds) * 8 // 较缓慢的曲线
        );
        
        if (estimatedProgress > downloadState.progress) {
          downloadState.progress = estimatedProgress;
          downloadState.downloadedSize = Math.floor((estimatedProgress / 100) * downloadState.totalSize);
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

const FileIcon = ({ fileName, theme }) => {
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
  const startDownload = useCallback(async (url, fileName, downloadId, appInfo = null) => {
    try {
      // 防止重复下载
      if (activeDownloads.current.has(url)) {
        console.log('下载已在进行中，跳过:', url);
        return;
      }
      
      // 记录活跃下载
      activeDownloads.current.add(url);
      
      // 获取文件大小
      let fileSize = 0;
      try {
        // 尝试获取准确的文件大小
        fileSize = await getFileSize(url);
        console.log(`开始下载前获取到文件大小: ${formatFileSize(fileSize)}`);
      } catch (e) {
        console.error('获取文件大小失败:', e);
      }
      
      // 初始化下载项
      const newDownload = {
        id: downloadId,
        url,
        fileName,
        status: 'pending',
        progress: 0,
        startTime: Date.now(),
        appInfo,
        downloadedSize: 0,
        totalSize: fileSize > 0 ? fileSize : 30 * 1024 * 1024, // 使用获取到的文件大小或默认值
        speed: 0,
        remainingTime: 0
      };
      
      // 检查是否已存在
      const alreadyExists = downloadList.some(d => 
        d.url === url && d.fileName === fileName && d.id === downloadId
      );
      
      if (!alreadyExists) {
        setDownloadList(prevList => {
          const updatedList = [newDownload, ...prevList];
          saveDownloadList(updatedList);
          return updatedList;
        });
      }

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
            progress: 0,
            downloadedSize: 0,
            totalSize: fileSize > 0 ? fileSize : d.totalSize || 30 * 1024 * 1024, // 使用获取到的文件大小
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
          
          // 验证进度数据有效性
          if (progressData.totalSize > 0 && 
              progressData.downloadedSize >= 0 && 
              progressData.downloadedSize <= progressData.totalSize) {
            
            console.log(`收到进度: ${formatFileSize(progressData.downloadedSize)}/${formatFileSize(progressData.totalSize)}`);
            
            // 更新下载列表中的进度
            setDownloadList(prevList => {
              return prevList.map(d => {
                if (d.id === downloadId) {
                  // 计算正确的进度百分比
                  const progressPercent = Math.min(99, Math.floor((progressData.downloadedSize / progressData.totalSize) * 100));
                  
                  return {
                    ...d,
                    status: 'downloading',
                    progress: progressPercent,
                    downloadedSize: progressData.downloadedSize,
                    totalSize: progressData.totalSize,
                    speed: progressData.speed || d.speed,
                    remainingTime: progressData.remainingTime || d.remainingTime,
                    lastUpdated: Date.now(),
                    isRealProgress: progressData.isRealProgress || false,
                    isEstimatedProgress: progressData.isEstimatedProgress || false
                  };
                }
                return d;
              });
            });
          }
        }
      };
      
      // 监听下载进度事件
      addDownloadListener('onProgress', handleProgress);
      
      // 开始下载
      console.log(`开始下载 ${url} 到 ${savePath}`);
      const result = await downloadFile(url, finalFileName, savePath, appInfo);
      
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
      } else if (result && result.paused) {
        // 处理暂停状态
        console.log(`下载已暂停: ${finalFileName}`);
        
        setDownloadList(prevList => {
          const updatedList = prevList.map(d => 
            d.id === downloadId ? { 
              ...d, 
              status: 'paused',
              progress: result.progress || d.progress,
              downloadedSize: result.downloadedSize || d.downloadedSize,
              totalSize: result.totalSize || d.totalSize
            } : d
          );
          saveDownloadList(updatedList);
          return updatedList;
        });
      } else {
        // 处理失败状态
        console.log(`下载失败: ${finalFileName}`);
        
        setDownloadList(prevList => {
          const updatedList = prevList.map(d => 
            d.id === downloadId ? { 
              ...d, 
              status: 'failed', 
              error: result?.error || 'Download failed' 
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
    } finally {
      // 清理活跃下载记录
      activeDownloads.current.delete(url);
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
    // 修改Tauri下载进度事件监听
    console.log('设置主进度监听器');
    
    // 监听Tauri下载进度事件
    const unlistenFn = listen('download-progress', (event) => {
      const progress = event.payload;
      
      // 验证进度数据有效性
      if (progress && 
          typeof progress.downloaded === 'number' && 
          typeof progress.total === 'number' && 
          progress.total > 0 && 
          progress.downloaded <= progress.total) {
        
        console.log(`全局进度事件: ${formatFileSize(progress.downloaded)}/${formatFileSize(progress.total)}`);
        
        // 查找所有正在下载的任务
        setDownloadList(prevList => {
          const activeDownloads = prevList.filter(d => d.status === 'downloading');
          if (activeDownloads.length === 0) return prevList;
          
          // 计算精确的进度百分比
          const progressPercent = Math.min(99, Math.floor((progress.downloaded / progress.total) * 100));
          
          // 如果只有一个下载任务，确保更新它
          if (activeDownloads.length === 1) {
            const download = activeDownloads[0];
            
            return prevList.map(d => {
              if (d.id === download.id) {
                // 如果总大小与当前显示的不同且有效，则更新
                const newTotalSize = (progress.total > 0 && (!d.totalSize || progress.total !== d.totalSize)) 
                  ? progress.total 
                  : d.totalSize;
                
                // 计算实时下载速度
                const currentTime = Date.now();
                const elapsedTime = currentTime - d.lastUpdated;
                let downloadSpeed = d.speed;
                
                // 只有在有足够的时间差时才更新速度
                if (elapsedTime > 500) {
                  const bytesDownloaded = progress.downloaded - (d.downloadedSize || 0);
                  
                  if (bytesDownloaded > 0) {
                    const instantSpeed = (bytesDownloaded / elapsedTime) * 1000;
                    
                    // 平滑速度计算
                    if (d.speed > 0) {
                      downloadSpeed = 0.7 * d.speed + 0.3 * instantSpeed;
                    } else {
                      downloadSpeed = instantSpeed;
                    }
                  }
                }
                
                // 计算剩余时间
                let remainingTime = 0;
                if (downloadSpeed > 0) {
                  const remainingBytes = newTotalSize - progress.downloaded;
                  remainingTime = remainingBytes / downloadSpeed;
                }
                
                return {
                  ...d,
                  progress: progressPercent,
                  downloadedSize: progress.downloaded,
                  totalSize: newTotalSize,
                  speed: downloadSpeed,
                  remainingTime: remainingTime,
                  lastUpdated: currentTime,
                  isRealProgress: true
                };
              }
              return d;
            });
          }
          
          // 多个下载任务时，查找匹配的下载
          // 注意：这是近似处理，无法确保100%匹配正确的下载
          return prevList.map(d => {
            if (d.status === 'downloading') {
              const currentTime = Date.now();
              // 简单更新进度，不处理复杂的速度计算
              return {
                ...d,
                progress: progressPercent,
                downloadedSize: progress.downloaded,
                totalSize: progress.total,
                lastUpdated: currentTime
              };
            }
            return d;
          });
        });
      }
    });
    
    // 设置定时刷新下载信息
    const refreshInterval = setInterval(() => {
      setDownloadList(prevList => {
        // 只处理正在下载的任务
        const hasActiveDownloads = prevList.some(d => d.status === 'downloading');
        if (!hasActiveDownloads) return prevList;
        
        // 更新所有下载项的实时速度和剩余时间
        const currentTime = Date.now();
        
        return prevList.map(d => {
          if (d.status === 'downloading') {
            // 计算总下载时间
            const totalElapsedSeconds = (currentTime - d.startTime) / 1000;
            
            // 如果有下载数据，更新平均速度
            if (totalElapsedSeconds > 0 && d.downloadedSize > 0) {
              const avgSpeed = d.downloadedSize / totalElapsedSeconds;
              
              // 计算剩余时间
              let remainingTime = 0;
              if (avgSpeed > 0 && d.totalSize > d.downloadedSize) {
                const remainingBytes = d.totalSize - d.downloadedSize;
                remainingTime = remainingBytes / avgSpeed;
              }
              
              // 只更新计算值，不更新进度
              return {
                ...d,
                speed: d.speed || avgSpeed,
                remainingTime: d.remainingTime || remainingTime,
                lastRefreshed: currentTime
              };
            }
          }
          return d;
        });
      });
    }, 1000);
    
    return () => {
      unlistenFn.then(unlisten => unlisten());
      clearInterval(refreshInterval);
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
      // Mark the download as pending in the UI
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === download.id ? { ...d, status: 'pending' } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
      });
      
      // Create a new download ID to ensure a fresh download process
      const newDownloadId = Date.now();
      
      // Remove the old download before starting a new one
      setDownloadList(prevList => {
        const filteredList = prevList.filter(d => d.id !== download.id);
        saveDownloadList(filteredList);
        return filteredList;
      });
      
      // Start a new download with the same file information
      await startDownload(download.url, download.fileName, newDownloadId, download.appInfo);
    } catch (error) {
      console.error('Failed to resume download:', error);
      
      // Restore the paused state if resuming fails
      setDownloadList(prevList => {
        const updatedList = prevList.map(d => 
          d.id === download.id ? { ...d, status: 'paused' } : d
        );
        saveDownloadList(updatedList);
        return updatedList;
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
                      <FileIcon fileName={download.fileName} theme={theme} />
                      <div>
                        <FileName theme={theme}>{download.fileName}</FileName>
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
                                  {download.isEstimatedProgress ? '预估速度: ' : '速度: '}
                                  {formatSpeed(download.speed || 0)}
                                </span>
                              </div>
                              <div>
                                <span>
                                  {download.isEstimatedProgress ? '预估剩余: ' : '剩余: '}
                                  {formatTime(download.remainingTime || 0)}
                                </span>
                              </div>
                            </>
                          )}
                          
                          <div style={{ width: '100%', marginTop: '4px' }}>
                            <span>
                              {typeof download.downloadedSize !== 'undefined' ? 
                                `${formatFileSize(download.downloadedSize)} / ${formatFileSize(download.totalSize || 0)}` + 
                                (download.isEstimatedProgress ? ' (预估)' : '') : 
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