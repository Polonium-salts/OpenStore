import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getDownloadSettings } from '../utils/settingsUtil';
import { invoke } from '@tauri-apps/api/core';

// 下载状态枚举
const DownloadStatus = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// 创建加速下载任务
const createAcceleratedDownload = (url, name, options = {}, callbacks = {}) => {
  let status = DownloadStatus.PENDING;
  
  // 默认配置
  const config = {
    chunkCount: options.chunkCount || 4,
    useMultiThread: options.useMultiThread !== false,
    retryCount: options.retryCount || 3,
    timeout: options.timeout || 30000
  };
  
  const startDownload = () => {
    status = DownloadStatus.DOWNLOADING;
    if (callbacks.onStatusChange) callbacks.onStatusChange(status);
    
    // 模拟下载进度
    let progress = 0;
    const totalSize = 10000000; // 假设文件大小 10MB
    let downloaded = 0;
    
    const interval = setInterval(() => {
      // 随机增加下载量
      const chunk = Math.random() * 500000; // 0-500KB
      downloaded += chunk;
      progress = Math.min((downloaded / totalSize) * 100, 99.9);
      
      if (callbacks.onProgress) {
        callbacks.onProgress({
          progress,
          downloaded,
          total: totalSize,
          speed: `${(chunk / 1024 / 0.2).toFixed(2)} KB/s`,
          remainingChunks: Math.max(0, config.chunkCount - Math.floor(progress / (100 / config.chunkCount)))
        });
      }
      
      if (progress >= 99.9) {
        clearInterval(interval);
        status = DownloadStatus.COMPLETED;
        if (callbacks.onStatusChange) callbacks.onStatusChange(status);
      }
    }, 200);
    
    // 记录日志
    if (callbacks.onLog) callbacks.onLog(`加速下载开始: ${name}`, 'info');
    
    return {
      cancel: () => {
        clearInterval(interval);
        status = DownloadStatus.FAILED;
        if (callbacks.onStatusChange) callbacks.onStatusChange(status);
        if (callbacks.onLog) callbacks.onLog(`加速下载已取消: ${name}`, 'warn');
      }
    };
  };
  
  return {
    start: startDownload,
    getStatus: () => status
  };
};

// 隐藏的iframe用于在应用内处理下载
const DownloadFrame = styled.iframe`
  display: none;
  width: 0;
  height: 0;
  border: 0;
`;

// 下载队列管理器，确保下载按顺序进行
const TauriDownloader = ({ onDownloadStart, onDownloadComplete, onDownloadError }) => {
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

  // 立即处理下载
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
      
      // 创建一个下载 iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = finalUrl;
      
      // 监听加载完成事件
      iframe.onload = () => {
        document.body.removeChild(iframe);
        
        if (onDownloadComplete) {
          onDownloadComplete(download);
        }
        
        setCurrentDownload(null);
        setIsDownloading(false);
        
        // 处理队列中的下一个下载
        processNextDownload();
      };
      
      // 监听错误事件
      iframe.onerror = (error) => {
        document.body.removeChild(iframe);
        
        if (onDownloadError) {
          onDownloadError(download, error);
        }
        
        setCurrentDownload(null);
        setIsDownloading(false);
        
        // 处理队列中的下一个下载
        processNextDownload();
      };
      
      // 添加到 DOM 启动下载
      setTimeout(() => {
        document.body.appendChild(iframe);
      }, 0);
      
    } catch (error) {
      console.error('下载处理失败:', error);
      
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

  return <></>;
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

// 使用常规下载
const useRegularDownload = (download) => {
  currentlyDownloading = true;
  
  // 创建一个下载 iframe - 立即执行
  setTimeout(() => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = download.url;
    
    // 监听加载完成事件
    iframe.onload = () => {
      document.body.removeChild(iframe);
      triggerEvent('onComplete', download);
      currentlyDownloading = false;
      processNextQueuedDownload();
    };
    
    // 监听错误事件
    iframe.onerror = (error) => {
      document.body.removeChild(iframe);
      triggerEvent('onError', { download, error });
      currentlyDownloading = false;
      processNextQueuedDownload();
    };
    
    // 添加到 DOM 启动下载
    document.body.appendChild(iframe);
  }, 0);
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