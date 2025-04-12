import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

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

  // 添加下载到队列
  const addToQueue = (downloadUrl, fileName) => {
    const newDownload = {
      id: Date.now(),
      url: downloadUrl,
      name: fileName
    };
    
    setDownloadQueue(prev => [...prev, newDownload]);
    
    return newDownload.id;
  };

  // 处理队列
  useEffect(() => {
    if (!isDownloading && downloadQueue.length > 0) {
      const nextDownload = downloadQueue[0];
      setCurrentDownload(nextDownload);
      setIsDownloading(true);
      setDownloadQueue(prev => prev.slice(1));
      
      if (onDownloadStart) {
        onDownloadStart(nextDownload);
      }
    }
  }, [downloadQueue, isDownloading, onDownloadStart]);

  // 处理iframe加载完成事件
  const handleFrameLoad = () => {
    if (currentDownload) {
      if (onDownloadComplete) {
        onDownloadComplete(currentDownload);
      }
      
      setCurrentDownload(null);
      setIsDownloading(false);
    }
  };

  // 处理下载错误
  const handleFrameError = (error) => {
    if (currentDownload && onDownloadError) {
      onDownloadError(currentDownload, error);
    }
    
    setCurrentDownload(null);
    setIsDownloading(false);
  };

  return (
    <>
      {currentDownload && (
        <DownloadFrame 
          src={currentDownload.url} 
          onLoad={handleFrameLoad}
          onError={handleFrameError}
        />
      )}
    </>
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
  onError: []
};

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
    listeners[event].forEach(callback => callback(data));
  }
};

// 添加下载到队列
const downloadFile = (url, name) => {
  // 如果链接没有文件名，从 URL 中提取
  if (!name) {
    const urlObj = new URL(url);
    name = urlObj.pathname.split('/').pop() || 'download';
  }
  
  const download = { id: Date.now(), url, name };
  downloadQueue.push(download);
  
  // 触发开始事件
  triggerEvent('onStart', download);
  
  // 创建一个下载 iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  
  // 监听加载完成事件
  iframe.onload = () => {
    document.body.removeChild(iframe);
    triggerEvent('onComplete', download);
  };
  
  // 监听错误事件
  iframe.onerror = (error) => {
    document.body.removeChild(iframe);
    triggerEvent('onError', { download, error });
  };
  
  // 添加到 DOM 启动下载
  document.body.appendChild(iframe);
  
  return download.id;
};

// 导出下载工具
export const TauriDownloaderUtil = {
  downloadFile,
  addDownloadListener,
  removeDownloadListener
};

export default TauriDownloader; 