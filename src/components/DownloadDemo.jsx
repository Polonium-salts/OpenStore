import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DownloadButton from './DownloadButton';
import { 
  NativeDownloadManager, 
  addDownloadListener, 
  removeDownloadListener 
} from './NativeDownloadManager';
import { 
  isNativeDownloadEnabled, 
  setNativeDownloadEnabled,
  getNativeDownloadSettings,
  setNativeDownloadSettings
} from '../utils/settingsUtil';

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const SettingsCard = styled(Card)`
  margin-bottom: 30px;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const DownloadItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DownloadTitle = styled.h3`
  font-size: 16px;
  margin: 0 0 8px 0;
`;

const DownloadDescription = styled.p`
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
`;

const DownloadDemo = () => {
  const [nativeDownloadEnabled, setNativeDownloadEnabledState] = useState(true);
  const [downloadSettings, setDownloadSettingsState] = useState({
    downloadPath: null,
    autoOpenDownloads: false,
    notifyOnCompletion: true
  });
  const [downloadEvents, setDownloadEvents] = useState([]);

  // 初始化时加载设置
  useEffect(() => {
    const loadSettings = async () => {
      const enabled = await isNativeDownloadEnabled();
      setNativeDownloadEnabledState(enabled);
      
      const settings = await getNativeDownloadSettings();
      setDownloadSettingsState(settings);
    };
    
    loadSettings();
    
    // 注册下载事件监听器
    const handleStart = (download) => {
      setDownloadEvents(prev => [{
        id: download.id,
        type: 'start',
        url: download.url,
        fileName: download.fileName,
        timestamp: new Date()
      }, ...prev]);
    };
    
    const handleComplete = (download) => {
      setDownloadEvents(prev => [{
        id: download.id,
        type: 'complete',
        url: download.url,
        fileName: download.fileName,
        path: download.path,
        timestamp: new Date()
      }, ...prev]);
    };
    
    const handleError = (error) => {
      setDownloadEvents(prev => [{
        id: Date.now(),
        type: 'error',
        url: error.url,
        fileName: error.fileName,
        error: error.error,
        timestamp: new Date()
      }, ...prev]);
    };
    
    addDownloadListener('onStart', handleStart);
    addDownloadListener('onComplete', handleComplete);
    addDownloadListener('onError', handleError);
    
    // 组件卸载时移除监听器
    return () => {
      removeDownloadListener('onStart', handleStart);
      removeDownloadListener('onComplete', handleComplete);
      removeDownloadListener('onError', handleError);
    };
  }, []);

  // 切换原生下载状态
  const toggleNativeDownload = async (e) => {
    const enabled = e.target.checked;
    await setNativeDownloadEnabled(enabled);
    setNativeDownloadEnabledState(enabled);
  };
  
  // 更新下载设置
  const updateSettings = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const newSettings = {
      ...downloadSettings,
      [name]: newValue
    };
    
    await setNativeDownloadSettings(newSettings);
    setDownloadSettingsState(newSettings);
  };

  return (
    <Container>
      <Title>Tauri 原生下载演示</Title>
      
      {/* 下载管理器组件（不可见，仅提供功能） */}
      <NativeDownloadManager />
      
      {/* 设置卡片 */}
      <SettingsCard>
        <h2>下载设置</h2>
        
        <InputGroup>
          <Label>
            <Checkbox 
              type="checkbox" 
              checked={nativeDownloadEnabled}
              onChange={toggleNativeDownload}
            />
            启用 Tauri 原生下载
          </Label>
        </InputGroup>
        
        <InputGroup>
          <Label>下载保存路径（可选，留空使用应用数据目录）</Label>
          <Input 
            type="text"
            name="downloadPath"
            value={downloadSettings.downloadPath || ''}
            onChange={updateSettings}
            placeholder="例如：C:/Downloads"
          />
        </InputGroup>
        
        <InputGroup>
          <Label>
            <Checkbox 
              type="checkbox"
              name="autoOpenDownloads"
              checked={downloadSettings.autoOpenDownloads}
              onChange={updateSettings}
            />
            下载完成后自动打开文件
          </Label>
        </InputGroup>
        
        <InputGroup>
          <Label>
            <Checkbox 
              type="checkbox"
              name="notifyOnCompletion"
              checked={downloadSettings.notifyOnCompletion}
              onChange={updateSettings}
            />
            下载完成后通知
          </Label>
        </InputGroup>
      </SettingsCard>
      
      {/* 示例下载列表 */}
      <Card>
        <h2>示例下载</h2>
        
        <DownloadItem>
          <DownloadTitle>示例文本文件</DownloadTitle>
          <DownloadDescription>
            简单的文本文件下载示例 (10KB)
          </DownloadDescription>
          <DownloadButton 
            url="https://example.com/sample.txt"
            fileName="sample.txt"
            label="下载文本文件"
          />
        </DownloadItem>
        
        <DownloadItem>
          <DownloadTitle>示例 PDF 文档</DownloadTitle>
          <DownloadDescription>
            PDF文档下载示例 (500KB)
          </DownloadDescription>
          <DownloadButton 
            url="https://example.com/sample.pdf"
            fileName="sample.pdf"
            label="下载 PDF"
          />
        </DownloadItem>
        
        <DownloadItem>
          <DownloadTitle>示例图片</DownloadTitle>
          <DownloadDescription>
            JPG图片下载示例 (200KB)
          </DownloadDescription>
          <DownloadButton 
            url="https://example.com/sample.jpg"
            fileName="sample.jpg"
            label="下载图片"
          />
        </DownloadItem>
      </Card>
      
      {/* 下载事件日志 */}
      <Card>
        <h2>下载事件日志</h2>
        
        {downloadEvents.length === 0 ? (
          <p>暂无下载事件</p>
        ) : (
          downloadEvents.map(event => (
            <div key={event.id + event.type} style={{ 
              padding: '10px', 
              marginBottom: '5px',
              backgroundColor: 
                event.type === 'start' ? '#f0f8ff' : 
                event.type === 'complete' ? '#f0fff0' : 
                '#fff0f0',
              borderRadius: '4px'
            }}>
              <div>
                <strong>
                  {event.type === 'start' ? '开始下载' : 
                  event.type === 'complete' ? '下载完成' : 
                  '下载出错'}
                </strong> - {event.fileName}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {event.timestamp.toLocaleTimeString()}
              </div>
              {event.type === 'complete' && (
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  保存路径: {event.path}
                </div>
              )}
              {event.type === 'error' && (
                <div style={{ fontSize: '12px', color: 'red', marginTop: '5px' }}>
                  错误: {event.error}
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </Container>
  );
};

export default DownloadDemo; 