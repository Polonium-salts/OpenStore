import React, { useState } from 'react';
import styled from 'styled-components';
import { downloadFile } from './NativeDownloadManager';
import { isNativeDownloadEnabled } from '../utils/settingsUtil';

const Button = styled.button`
  background-color: #4a86e8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #3a76d8;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: ${props => props.error ? 'red' : 'green'};
`;

/**
 * 下载按钮组件
 * 
 * @param {Object} props
 * @param {string} props.url - 下载URL
 * @param {string} props.fileName - 文件名
 * @param {string} props.savePath - 保存路径 (可选)
 * @param {string} props.label - 按钮文本 (可选)
 * @param {Function} props.onComplete - 下载完成回调 (可选)
 * @param {Function} props.onError - 下载错误回调 (可选)
 */
const DownloadButton = ({ 
  url, 
  fileName, 
  savePath = null, 
  label = '下载',
  onComplete = null,
  onError = null
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setStatus('开始下载...');
      setError(null);

      // 检查是否启用了原生下载
      const useNativeDownload = await isNativeDownloadEnabled();
      
      if (useNativeDownload) {
        // 使用Tauri原生下载
        const result = await downloadFile(url, fileName, savePath);
        
        if (result.success) {
          setStatus(`下载完成：${result.path}`);
          if (onComplete) onComplete(result);
        } else {
          throw new Error(result.error || '下载失败');
        }
      } else {
        // 如果未启用原生下载，使用浏览器下载
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setStatus('下载已启动（浏览器下载）');
        if (onComplete) onComplete({ success: true });
      }
    } catch (err) {
      console.error('下载错误:', err);
      setStatus(null);
      setError(`下载失败: ${err.message}`);
      if (onError) onError(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? '下载中...' : label}
      </Button>
      
      {status && !error && (
        <StatusIndicator>{status}</StatusIndicator>
      )}
      
      {error && (
        <StatusIndicator error>{error}</StatusIndicator>
      )}
    </div>
  );
};

export default DownloadButton; 