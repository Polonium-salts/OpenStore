import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getDownloadSettings } from '../utils/settingsUtil';
import mime from 'mime';

// HTTP Client下载器容器
const DownloadContainer = styled.div`
  display: none;
`;

// 下载进度信息
const DownloadProgress = styled.div`
  padding: 10px;
  background: ${props => props.theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
  border-radius: 8px;
  margin: 5px 0;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#333333'};
`;

// 进度条
const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${props => props.theme === 'dark' ? '#404040' : '#e0e0e0'};
  border-radius: 3px;
  overflow: hidden;
  margin: 5px 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  width: ${props => props.progress || 0}%;
  transition: width 0.3s ease;
`;

// 格式化速度显示
const formatSpeed = (bytesPerSecond) => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let size = bytesPerSecond;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// 格式化文件大小显示
const formatFileSize = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// 下载队列管理器，确保下载按顺序进行
const TauriDownloader = ({ onDownloadStart, onDownloadComplete, onDownloadError, theme }) => {
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [currentDownload, setCurrentDownload] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 添加下载到队列并立即处理
  const addToQueue = (downloadUrl, fileName) => {
    const newDownload = {
      id: Date.now(),
      url: downloadUrl,
      name: fileName
    };
    
    // 立即开始下载而不是仅添加到队列
    if (!isDownloading) {
      processDownload(newDownload);
    } else {
      setDownloadQueue(prev => [...prev, newDownload]);
    }
    
    return newDownload.id;
  };

  // 使用HTTP Client进行下载
  const processDownload = async (download) => {
    setCurrentDownload(download);
    setIsDownloading(true);
    
    if (onDownloadStart) {
      onDownloadStart(download);
    }
    
    try {
      const settings = await getDownloadSettings();
      const proxyUrl = settings.useProxy ? settings.proxyUrl : null;
      
      // 使用代理URL或直接URL
      const finalUrl = proxyUrl ? `${proxyUrl}?url=${encodeURIComponent(download.url)}` : download.url;
      
      console.log(`开始HTTP下载: ${download.name}`);
      console.log(`下载URL: ${finalUrl}`);
      
      // 使用fetch进行下载
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'OpenStore/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }
      
      // 获取文件大小
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      console.log(`文件大小: ${totalSize} bytes`);
      
      // 获取文件名，优先从Content-Disposition获取，其次从URL路径获取
      let fileName = download.name || 'downloaded_file'; // 默认使用传入的name
      console.log('初始文件名:', fileName);
      
      const contentDisposition = response.headers.get('content-disposition');
      console.log('Content-Disposition:', contentDisposition);
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;"\r\n]*?)['"]?(?:;|$)/i);
        if (fileNameMatch && fileNameMatch[1]) {
          try {
            fileName = decodeURIComponent(fileNameMatch[1]);
            console.log('从Content-Disposition获取文件名:', fileName);
          } catch (e) {
            fileName = fileNameMatch[1]; // 如果解码失败，使用原始值
            console.warn('无法解码Content-Disposition中的文件名:', fileNameMatch[1], e);
          }
        } else {
          // 尝试另一种常见的filename格式
          const basicFileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (basicFileNameMatch && basicFileNameMatch[1]) {
            fileName = basicFileNameMatch[1];
            console.log('从Content-Disposition基本格式获取文件名:', fileName);
          }
        }
      }

      // 如果Content-Disposition中没有文件名，或者文件名不包含后缀，尝试从URL解析
      if (!fileName || !fileName.includes('.')) {
        try {
          const urlPath = new URL(finalUrl).pathname;
          const segments = urlPath.split('/');
          const lastSegment = segments.pop() || segments.pop(); // 处理末尾可能有斜杠的情况
          if (lastSegment && lastSegment.includes('.')) {
            fileName = decodeURIComponent(lastSegment);
            console.log('从URL获取文件名:', fileName);
          }
        } catch (e) {
          console.warn('无法从URL解析文件名:', finalUrl, e);
        }
      }

      // 如果文件名仍然没有后缀，尝试从MIME类型推断
      if (!fileName.includes('.')) {
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        if (contentType) {
          const extension = mime.extension(contentType);
          if (extension) {
            fileName = `${fileName}.${extension}`;
            console.log('从MIME类型推断文件名:', fileName);
          }
        }
      }
      
      console.log('最终文件名:', fileName);
      
      // 创建可读流读取器
      const reader = response.body.getReader();
      const chunks = [];
      let downloadedSize = 0;
      let lastUpdateTime = Date.now();
      let lastDownloadedSize = 0;
      
      // 读取数据流
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        downloadedSize += value.length;
        
        // 计算进度和速度
        const now = Date.now();
        if (now - lastUpdateTime >= 1000) { // 每秒更新一次
          const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
          const timeDiff = (now - lastUpdateTime) / 1000;
          const sizeDiff = downloadedSize - lastDownloadedSize;
          const speed = formatSpeed(sizeDiff / timeDiff);
          
          console.log(`下载进度: ${progress.toFixed(1)}%, 速度: ${speed}`);
          
          // 触发进度事件
          if (onDownloadStart) {
            onDownloadStart({
              ...download,
              progress: progress,
              downloadedSize: downloadedSize,
              totalSize: totalSize,
              speed: speed
            });
          }
          
          lastUpdateTime = now;
          lastDownloadedSize = downloadedSize;
        }
      }
      
      // 合并所有数据块
      const blob = new Blob(chunks);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 清理URL对象
      window.URL.revokeObjectURL(url);
      
      console.log(`下载完成: ${fileName}`);
      
      if (onDownloadComplete) {
        onDownloadComplete({
          ...download,
          progress: 100,
          downloadedSize: downloadedSize,
          totalSize: totalSize || downloadedSize,
          fileName: fileName
        });
      }
      
      setCurrentDownload(null);
      setIsDownloading(false);
      
      // 处理队列中的下一个下载
      processNextDownload();
      
    } catch (error) {
      console.error('HTTP下载失败:', error);
      
      if (onDownloadError) {
        onDownloadError(download, error);
      }
      
      setCurrentDownload(null);
      setIsDownloading(false);
      
      // 处理队列中的下一个下载
      processNextDownload();
    }
  };

  // 处理队列中的下一个下载
  const processNextDownload = () => {
    if (downloadQueue.length > 0) {
      const nextDownload = downloadQueue[0];
      setDownloadQueue(prev => prev.slice(1));
      processDownload(nextDownload);
    }
  };

  return (
    <DownloadContainer>
      {currentDownload && (
        <DownloadProgress theme={theme}>
          <div>正在下载: {currentDownload.name}</div>
          {currentDownload.progress !== undefined && (
            <>
              <ProgressBar theme={theme}>
                <ProgressFill progress={currentDownload.progress} />
              </ProgressBar>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                进度: {currentDownload.progress?.toFixed(1)}% | 
                速度: {currentDownload.speed || '计算中...'} | 
                大小: {formatFileSize(currentDownload.downloadedSize || 0)} / {formatFileSize(currentDownload.totalSize || 0)}
              </div>
            </>
          )}
        </DownloadProgress>
      )}
    </DownloadContainer>
  );
};

// 导出组件和辅助方法
export { TauriDownloader };

// 创建一个单例下载器实例
let downloaderInstance = null;
let downloadQueue = [];
let listeners = {
  onStart: [],
  onComplete: [],
  onError: [],
  onProgress: []
};
let currentlyDownloading = false;

// 添加事件监听器
const addDownloadListener = (event, callback) => {
  if (listeners[event]) {
    listeners[event].push(callback);
  }
};

// 移除事件监听器
const removeDownloadListener = (event, callback) => {
  if (listeners[event]) {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }
};

// 触发事件
const triggerEvent = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e);
      }
    });
  }
};

// 切换加速下载模式
export const toggleAcceleratedDownload = (enabled) => {
  localStorage.setItem('useAcceleratedDownload', enabled.toString());
  return enabled;
};

// 获取加速下载模式状态
export const isAcceleratedDownloadEnabled = () => {
  return localStorage.getItem('useAcceleratedDownload') === 'true';
};

// 立即处理下载文件
const downloadFile = (url, name) => {
  // 如果链接没有文件名，从 URL 中提取
  if (!name) {
    try {
      const urlObj = new URL(url);
      name = urlObj.pathname.split('/').pop() || 'download';
    } catch (e) {
      console.error('Invalid URL:', url);
      name = 'download';
    }
  }
  
  const download = { id: Date.now(), url, name };
  
  // 立即触发开始事件以提供用户反馈
  triggerEvent('onStart', download);
  
  // 直接从localStorage读取加速下载设置，确保使用最新设置
  const useAcceleratedDownload = localStorage.getItem('useAcceleratedDownload') === 'true';
  console.log(`下载模式: ${useAcceleratedDownload ? '多线程加速' : '标准单线程'}`);

  // 立即执行下载而非放入队列
  if (useAcceleratedDownload) {
    try {
      console.log(`使用加速下载: ${name}`);
      
      // 创建加速下载任务，使用可配置的线程数
      const threadCount = 8; // 可以从配置中读取
      
      const acceleratedDownload = createAcceleratedDownload(
        url,
        name,
        { 
          chunkCount: threadCount,
          useMultiThread: true,
          retryCount: 3, // 设置重试次数
          timeout: 60000 // 增加超时时间
        },
        {
          onProgress: (progress) => {
            // 更新进度并包含当前速度
            const progressInfo = {
              progress: progress.progress,
              speed: progress.speed || '计算中...',
              downloaded: progress.downloaded,
              total: progress.total,
              remainingChunks: progress.remainingChunks
            };
            
            // 记录详细日志
            if (progress.progress % 10 < 0.1) { // 每10%记录一次
              console.log(`下载进度: ${progress.progress.toFixed(1)}%, 速度: ${progress.speed || '计算中...'}`);
            }
            
            triggerEvent('onProgress', { download, progress: progressInfo });
          },
          onStatusChange: (status) => {
            console.log(`下载状态变更: ${status}`);
            
            if (status === DownloadStatus.COMPLETED) {
              console.log(`多线程下载完成: ${name}`);
              triggerEvent('onComplete', download);
              currentlyDownloading = false;
              processNextQueuedDownload();
            } else if (status === DownloadStatus.FAILED) {
              console.error(`多线程下载失败: ${name}`);
              triggerEvent('onError', { download, error: new Error('加速下载失败') });
              currentlyDownloading = false;
              processNextQueuedDownload();
            }
          },
          onError: (error) => {
            console.error(`下载错误: ${error.message}`);
            
            // 尝试回退到常规下载
            console.log(`尝试回退到常规下载: ${name}`);
            triggerEvent('onError', { 
              download, 
              error: new Error(`加速下载错误: ${error.message}，尝试使用常规下载`) 
            });
            
            // 回退到常规下载
            useRegularDownload(download);
          },
          onLog: (message, type) => {
            console.log(`[加速下载器] ${message}`);
          }
        }
      );
      
      // 立即启动下载
      console.log(`正在启动加速下载: ${name} (${threadCount} 线程)`);
      setTimeout(() => {
        acceleratedDownload.start();
      }, 0);
      
    } catch (error) {
      console.error(`创建加速下载任务失败: ${error.message}`);
      console.log(`回退到常规下载: ${name}`);
      
      // 回退到常规下载
      useRegularDownload(download);
    }
  } else {
    // 使用常规下载
    console.log(`使用常规单线程下载: ${name}`);
    useRegularDownload(download);
  }
  
  return download.id;
};

// 处理队列中的下一个下载
const processNextQueuedDownload = () => {
  if (downloadQueue.length > 0 && !currentlyDownloading) {
    const nextDownload = downloadQueue.shift();
    downloadFile(nextDownload.url, nextDownload.name);
  }
};

// 使用HTTP Client常规下载
const useRegularDownload = async (download) => {
  currentlyDownloading = true;
  
  try {
    console.log(`开始常规HTTP下载: ${download.name}`);
    
    // 使用fetch进行下载
    const response = await fetch(download.url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'OpenStore/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }
    
    // 获取文件大小
    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
    
    // 获取文件名，优先从Content-Disposition获取，其次从URL路径获取
    let fileName = download.name || 'downloaded_file'; // 默认使用传入的name
    console.log('常规下载初始文件名:', fileName);
    
    const contentDisposition = response.headers.get('content-disposition');
    console.log('常规下载Content-Disposition:', contentDisposition);
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;"\r\n]*?)['"]?(?:;|$)/i);
      if (fileNameMatch && fileNameMatch[1]) {
        try {
          fileName = decodeURIComponent(fileNameMatch[1]);
          console.log('常规下载从Content-Disposition获取文件名:', fileName);
        } catch (e) {
          fileName = fileNameMatch[1]; // 如果解码失败，使用原始值
          console.warn('无法解码Content-Disposition中的文件名:', fileNameMatch[1], e);
        }
      } else {
        // 尝试另一种常见的filename格式
        const basicFileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (basicFileNameMatch && basicFileNameMatch[1]) {
          fileName = basicFileNameMatch[1];
          console.log('常规下载从Content-Disposition基本格式获取文件名:', fileName);
        }
      }
    }

    // 如果Content-Disposition中没有文件名，或者文件名不包含后缀，尝试从URL解析
    if (!fileName || !fileName.includes('.')) {
      try {
        const urlPath = new URL(download.url).pathname; // 使用原始URL进行解析
        const segments = urlPath.split('/');
        const lastSegment = segments.pop() || segments.pop(); // 处理末尾可能有斜杠的情况
        if (lastSegment && lastSegment.includes('.')) {
          fileName = decodeURIComponent(lastSegment);
          console.log('常规下载从URL获取文件名:', fileName);
        }
      } catch (e) {
        console.warn('无法从URL解析文件名:', download.url, e);
      }
    }

    // 如果文件名仍然没有后缀，尝试从MIME类型推断
    if (!fileName.includes('.')) {
      const contentType = response.headers.get('content-type');
      console.log('常规下载Content-Type:', contentType);
      if (contentType) {
        const extension = mime.extension(contentType);
        if (extension) {
          fileName = `${fileName}.${extension}`;
          console.log('常规下载从MIME类型推断文件名:', fileName);
        }
      }
    }
    
    console.log('常规下载最终文件名:', fileName);
    
    // 创建可读流读取器
    const reader = response.body.getReader();
    const chunks = [];
    let downloadedSize = 0;
    let lastUpdateTime = Date.now();
    let lastDownloadedSize = 0;
    
    // 读取数据流并显示进度
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      downloadedSize += value.length;
      
      // 计算进度和速度
      const now = Date.now();
      if (now - lastUpdateTime >= 1000) { // 每秒更新一次
        const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
        const timeDiff = (now - lastUpdateTime) / 1000;
        const sizeDiff = downloadedSize - lastDownloadedSize;
        const speed = formatSpeed(sizeDiff / timeDiff);
        
        console.log(`常规下载进度: ${progress.toFixed(1)}%, 速度: ${speed}`);
        
        // 触发进度事件
        triggerEvent('onProgress', {
          download,
          progress: {
            progress: progress,
            downloadedSize: downloadedSize,
            totalSize: totalSize,
            speed: speed
          }
        });
        
        lastUpdateTime = now;
        lastDownloadedSize = downloadedSize;
      }
    }
    
    // 合并所有数据块
    const blob = new Blob(chunks);
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 清理URL对象
    window.URL.revokeObjectURL(url);
    
    console.log(`常规下载完成: ${fileName}`);
    
    triggerEvent('onComplete', {
      ...download,
      progress: 100,
      downloadedSize: downloadedSize,
      totalSize: totalSize || downloadedSize,
      fileName: fileName
    });
    
    currentlyDownloading = false;
    processNextQueuedDownload();
    
  } catch (error) {
    console.error('常规HTTP下载失败:', error);
    triggerEvent('onError', { download, error });
    currentlyDownloading = false;
    processNextQueuedDownload();
  }
};

// 导出下载工具
export const TauriDownloaderUtil = {
  downloadFile,
  addDownloadListener,
  removeDownloadListener,
  toggleAcceleratedDownload,
  isAcceleratedDownloadEnabled
};

export default TauriDownloader;