import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import styled from 'styled-components';
import { createAcceleratedDownload, DownloadStatus as AcceleratedDownloadStatus } from '../services/acceleratedDownloader';
import { getDownloadSettings, setDownloadSettings } from '../utils/settingsUtil';

// 样式组件
const DownloadManagerContainer = styled.div`
  padding: 20px;
  background: ${props => props.theme === 'dark' ? '#2a2a2d' : '#f5f5f5'};
  border-radius: 8px;
  margin: 20px;
`;

const DownloadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#ddd'};
`;

const Title = styled.h2`
  margin: 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
  font-size: 24px;
`;

const AddDownloadButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;

  &:hover {
    background: #0056b3;
  }
`;

const DownloadList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const DownloadItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'status'
})`
  background: ${props => props.theme === 'dark' ? '#1d1d1f' : 'white'};
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0,0,0,0.1)'};
  border-left: 4px solid ${props => {
    switch(props.status) {
      case 'Downloading': return '#007bff';
      case 'Completed': return '#28a745';
      case 'Failed': return '#dc3545';
      case 'Paused': return '#ffc107';
      case 'Cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  }};
`;

const DownloadInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const FileName = styled.div`
  font-weight: bold;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
  font-size: 16px;
`;

const DownloadStatus = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'status'
})`
  color: ${props => {
    switch(props.status) {
      case 'Downloading': return '#007bff';
      case 'Completed': return '#28a745';
      case 'Failed': return '#dc3545';
      case 'Paused': return '#ffc107';
      case 'Cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  }};
  font-weight: bold;
`;

const ProgressContainer = styled.div`
  margin: 10px 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme === 'dark' ? '#3a3a3d' : '#e9ecef'};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    switch(props.status) {
      case 'Downloading': return '#007bff';
      case 'Completed': return '#28a745';
      case 'Failed': return '#dc3545';
      case 'Paused': return '#ffc107';
      default: return '#6c757d';
    }
  }};
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const ActionButton = styled.button`
  padding: 5px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
  
  &.start {
    background: #28a745;
    color: white;
    &:hover { background: #218838; }
  }
  
  &.pause {
    background: #ffc107;
    color: #212529;
    &:hover { background: #e0a800; }
  }
  
  &.cancel {
    background: #dc3545;
    color: white;
    &:hover { background: #c82333; }
  }
  
  &.remove {
    background: #6c757d;
    color: white;
    &:hover { background: #5a6268; }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AddDownloadModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
`;

const ModalTitle = styled.h3`
  margin: 0 0 20px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background: ${props => props.theme === 'dark' ? '#1d1d1f' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
`;

const ModalButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  
  &.primary {
    background: #007bff;
    color: white;
    &:hover { background: #0056b3; }
  }
  
  &.secondary {
    background: #6c757d;
    color: white;
    &:hover { background: #5a6268; }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 16px;
`;

// 状态映射
const statusMap = {
  'Pending': '等待中',
  'Downloading': '下载中',
  'Paused': '已暂停',
  'Completed': '已完成',
  'Failed': '下载失败',
  'Cancelled': '已取消'
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const DownloadManager = ({ theme = 'light' }) => {
  const [downloads, setDownloads] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDownload, setNewDownload] = useState({
    url: '',
    fileName: '',
    downloadPath: '',
    useMultiThread: true,
    threadCount: 8
  });
  const [downloadSettings, setDownloadSettingsState] = useState({
    useMultiThread: true,
    threadCount: 8,
    chunkSize: 1024 * 1024,
    retryCount: 3
  });
  const [activeDownloads, setActiveDownloads] = useState(new Map());

  // 加载下载设置
  const loadDownloadSettings = async () => {
    try {
      const settings = await getDownloadSettings();
      setDownloadSettingsState({
        useMultiThread: settings.useMultiThread ?? true,
        threadCount: settings.threadCount ?? 8,
        chunkSize: settings.chunkSize ?? 1024 * 1024,
        retryCount: settings.retryCount ?? 3
      });
    } catch (error) {
      console.error('加载下载设置失败:', error);
    }
  };

  // 保存下载设置
  const saveDownloadSettings = async (newSettings) => {
    try {
      await setDownloadSettings(newSettings);
      setDownloadSettingsState(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('保存下载设置失败:', error);
    }
  };

  // 加载下载任务
  const loadDownloads = async () => {
    try {
      const tasks = await invoke('get_download_tasks');
      setDownloads(tasks);
    } catch (error) {
      console.error('加载下载任务失败:', error);
    }
  };

  // 创建下载任务
  const createDownload = async () => {
    if (!newDownload.url || !newDownload.fileName) {
      window.showError && window.showError('请填写下载链接和文件名');
      return;
    }

    try {
      let taskId;
      
      // 如果启用多线程下载，使用加速下载器
      if (newDownload.useMultiThread) {
        taskId = `multi_${Date.now()}`;
        
        const acceleratedDownload = createAcceleratedDownload(
          newDownload.url,
          newDownload.fileName,
          {
            chunkCount: newDownload.threadCount,
            chunkSize: downloadSettings.chunkSize,
            retryCount: downloadSettings.retryCount,
            useMultiThread: true
          },
          {
            onProgress: (progress) => {
              setDownloads(prev => prev.map(task => 
                task.id === taskId ? {
                  ...task,
                  progress: progress.progress,
                  downloaded_size: progress.downloaded,
                  total_size: progress.total,
                  speed: progress.speed,
                  status: 'Downloading'
                } : task
              ));
            },
            onStatusChange: (status) => {
              const statusMap = {
                [AcceleratedDownloadStatus.PENDING]: 'Pending',
                [AcceleratedDownloadStatus.ANALYZING]: 'Downloading',
                [AcceleratedDownloadStatus.DOWNLOADING]: 'Downloading',
                [AcceleratedDownloadStatus.MERGING]: 'Downloading',
                [AcceleratedDownloadStatus.COMPLETED]: 'Completed',
                [AcceleratedDownloadStatus.FAILED]: 'Failed',
                [AcceleratedDownloadStatus.CANCELED]: 'Cancelled',
                [AcceleratedDownloadStatus.PAUSED]: 'Paused'
              };
              
              setDownloads(prev => prev.map(task => 
                task.id === taskId ? {
                  ...task,
                  status: statusMap[status] || status
                } : task
              ));
            },
            onComplete: () => {
              setDownloads(prev => prev.map(task => 
                task.id === taskId ? {
                  ...task,
                  status: 'Completed',
                  progress: 100
                } : task
              ));
              activeDownloads.delete(taskId);
              window.showSuccess && window.showSuccess(`文件 "${newDownload.fileName}" 下载完成`);
            },
            onError: (error) => {
              setDownloads(prev => prev.map(task => 
                task.id === taskId ? {
                  ...task,
                  status: 'Failed'
                } : task
              ));
              activeDownloads.delete(taskId);
              window.showError && window.showError(`下载失败: ${error.message}`);
            }
          }
        );
        
        // 添加到活动下载列表
        setActiveDownloads(prev => new Map(prev.set(taskId, acceleratedDownload)));
        
        // 添加到下载列表
        const newTask = {
          id: taskId,
          url: newDownload.url,
          file_name: newDownload.fileName,
          file_path: newDownload.downloadPath || '',
          total_size: 0,
          downloaded_size: 0,
          status: 'Pending',
          progress: 0,
          speed: '0 B/s',
          is_multi_thread: true,
          thread_count: newDownload.threadCount
        };
        
        setDownloads(prev => [...prev, newTask]);
        
        // 开始下载
        acceleratedDownload.start();
        
      } else {
        // 使用传统下载方式
        taskId = await invoke('create_download_task', {
          url: newDownload.url,
          fileName: newDownload.fileName,
          downloadPath: newDownload.downloadPath || null
        });
        
        loadDownloads();
      }
      
      console.log('创建下载任务成功:', taskId);
      setShowAddModal(false);
      setNewDownload({ 
        url: '', 
        fileName: '', 
        downloadPath: '',
        useMultiThread: true,
        threadCount: 8
      });
      
    } catch (error) {
      console.error('创建下载任务失败:', error);
      window.showError && window.showError('创建下载任务失败: ' + error);
    }
  };

  // 开始下载
  const startDownload = async (taskId) => {
    try {
      // 检查是否为多线程下载
      const activeDownload = activeDownloads.get(taskId);
      if (activeDownload) {
        activeDownload.start();
      } else {
        await invoke('start_download', { taskId });
      }
    } catch (error) {
      console.error('开始下载失败:', error);
      window.showError && window.showError('开始下载失败: ' + error);
    }
  };

  // 恢复下载
  const resumeDownload = async (taskId) => {
    try {
      // 检查是否为多线程下载
      const activeDownload = activeDownloads.get(taskId);
      if (activeDownload) {
        activeDownload.resume();
      } else {
        await invoke('resume_download', { taskId });
      }
    } catch (error) {
      console.error('恢复下载失败:', error);
      window.showError && window.showError('恢复下载失败: ' + error);
    }
  };

  // 暂停下载
  const pauseDownload = async (taskId) => {
    try {
      // 检查是否为多线程下载
      const activeDownload = activeDownloads.get(taskId);
      if (activeDownload) {
        activeDownload.pause();
      } else {
        await invoke('pause_download', { taskId });
      }
    } catch (error) {
      console.error('暂停下载失败:', error);
    }
  };

  // 取消下载
  const cancelDownload = async (taskId) => {
    try {
      // 检查是否为多线程下载
      const activeDownload = activeDownloads.get(taskId);
      if (activeDownload) {
        activeDownload.cancel();
        setActiveDownloads(prev => {
          const newMap = new Map(prev);
          newMap.delete(taskId);
          return newMap;
        });
      } else {
        await invoke('cancel_download', { taskId });
      }
    } catch (error) {
      console.error('取消下载失败:', error);
    }
  };

  // 删除下载任务
  const removeDownload = async (taskId) => {
    try {
      await invoke('remove_download_task', { taskId });
      loadDownloads();
    } catch (error) {
      console.error('删除下载任务失败:', error);
    }
  };

  // 创建副本下载
  const createCopyDownload = async (originalTaskId) => {
    const copyCount = window.showNumberPrompt ? 
      await window.showNumberPrompt('请输入要创建的副本数量:', '1') :
      prompt('请输入要创建的副本数量:', '1');
    
    if (!copyCount || isNaN(copyCount) || parseInt(copyCount) <= 0) {
      window.showError && window.showError('请输入有效的副本数量');
      return;
    }

    try {
      const createdTaskIds = await invoke('create_copy_download', {
        originalTaskId,
        copyCount: parseInt(copyCount)
      });
      console.log('创建副本成功:', createdTaskIds);
      loadDownloads();
      window.showSuccess && window.showSuccess(`成功创建 ${createdTaskIds.length} 个副本`);
    } catch (error) {
      console.error('创建副本失败:', error);
      window.showError && window.showError('创建副本失败: ' + error);
    }
  };

  // 监听下载事件
  useEffect(() => {
    let unlistenProgress, unlistenStatusChanged, unlistenCompleted, unlistenFailed, unlistenInstallerReady;
    
    const setupListeners = async () => {
      unlistenProgress = await listen('download_progress', (event) => {
        const updatedTask = event.payload;
        console.log('收到下载进度更新:', updatedTask);
        setDownloads(prev => {
          const newDownloads = prev.map(task => 
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          );
          // 如果任务不存在，添加它
          if (!prev.find(task => task.id === updatedTask.id)) {
            newDownloads.push(updatedTask);
          }
          return newDownloads;
        });
      });

      unlistenStatusChanged = await listen('download_status_changed', (event) => {
        const updatedTask = event.payload;
        console.log('收到状态变更:', updatedTask);
        setDownloads(prev => prev.map(task => 
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        ));
      });

      unlistenCompleted = await listen('download_completed', (event) => {
        const completedTask = event.payload;
        console.log('下载完成:', completedTask);
        setDownloads(prev => prev.map(task => 
          task.id === completedTask.id ? { ...task, ...completedTask } : task
        ));
      });

      unlistenFailed = await listen('download_failed', (event) => {
        const failedTask = event.payload;
        console.log('下载失败:', failedTask);
        setDownloads(prev => prev.map(task => 
          task.id === failedTask.id ? { ...task, ...failedTask } : task
        ));
        // 可以在这里添加错误提示
        window.showError && window.showError(`下载失败: ${failedTask.file_name}`);
      });

      unlistenInstallerReady = await listen('installer_ready', async (event) => {
        const installerTask = event.payload;
        console.log('安装程序准备就绪:', installerTask);
        // 显示运行安装程序的提示
        const shouldRun = window.showConfirm ? 
          await window.showConfirm(`下载完成！是否立即运行安装程序 "${installerTask.file_name}"？`) :
          window.confirm(`下载完成！是否立即运行安装程序 "${installerTask.file_name}"？`);
        
        if (shouldRun) {
          runInstaller(installerTask.file_path);
        }
      });
    };

    setupListeners();
    loadDownloads();
    loadDownloadSettings();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenStatusChanged) unlistenStatusChanged();
      if (unlistenCompleted) unlistenCompleted();
      if (unlistenFailed) unlistenFailed();
      if (unlistenInstallerReady) unlistenInstallerReady();
    };
  }, []);

  // 判断是否为安装程序文件
  const isInstallerFile = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'appimage'].includes(ext);
  };

  // 运行安装程序
  const runInstaller = async (filePath) => {
    try {
      await invoke('run_installer', { filePath: filePath });
      console.log('安装程序启动成功');
    } catch (error) {
      console.error('启动安装程序失败:', error);
      window.showError && window.showError(`启动安装程序失败: ${error}`);
    }
  };

  // 从URL提取文件名
  const extractFileName = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop();
      return fileName || 'download';
    } catch {
      return 'download';
    }
  };

  // 当URL改变时自动填充文件名
  const handleUrlChange = (url) => {
    setNewDownload(prev => ({
      ...prev,
      url,
      fileName: prev.fileName || extractFileName(url)
    }));
  };

  return (
    <DownloadManagerContainer theme={theme}>
      <DownloadHeader theme={theme}>
        <Title theme={theme}>下载管理器</Title>
        <AddDownloadButton onClick={() => setShowAddModal(true)}>
          添加下载
        </AddDownloadButton>
      </DownloadHeader>

      <DownloadList>
        {downloads.length === 0 ? (
          <EmptyState theme={theme}>
            暂无下载任务
          </EmptyState>
        ) : (
          downloads.map(download => (
            <DownloadItem key={download.id} status={download.status} theme={theme}>
              <DownloadInfo>
                <FileName theme={theme}>{download.file_name}</FileName>
                <DownloadStatus status={download.status}>
                  {statusMap[download.status] || download.status}
                </DownloadStatus>
              </DownloadInfo>
              
              <ProgressContainer>
                <ProgressBar theme={theme}>
                  <ProgressFill 
                    progress={download.progress || 0} 
                    status={download.status}
                  />
                </ProgressBar>
                <ProgressText theme={theme}>
                  <span>{(download.progress || 0).toFixed(1)}%</span>
                  <span>
                    {formatFileSize(download.downloaded_size || 0)} / {formatFileSize(download.total_size || 0)}
                  </span>
                  <span>{download.speed || '0.0 B/s'}</span>
                  {download.is_multi_thread && (
                    <span style={{ color: '#007bff', fontSize: '11px' }}>
                      多线程({download.thread_count || 8})
                    </span>
                  )}
                </ProgressText>
              </ProgressContainer>

              <ButtonGroup>
                {download.status === 'Pending' ? (
                  <ActionButton 
                    className="start" 
                    onClick={() => startDownload(download.id)}
                  >
                    开始
                  </ActionButton>
                ) : null}
                
                {download.status === 'Paused' ? (
                  <ActionButton 
                    className="start" 
                    onClick={() => resumeDownload(download.id)}
                  >
                    恢复
                  </ActionButton>
                ) : null}
                
                {download.status === 'Downloading' ? (
                  <ActionButton 
                    className="pause" 
                    onClick={() => pauseDownload(download.id)}
                  >
                    暂停
                  </ActionButton>
                ) : null}
                
                {download.status === 'Downloading' || download.status === 'Paused' ? (
                  <ActionButton 
                    className="cancel" 
                    onClick={() => cancelDownload(download.id)}
                  >
                    取消
                  </ActionButton>
                ) : null}
                
                {download.status === 'Completed' || download.status === 'Failed' || download.status === 'Cancelled' ? (
                  <>
                    {download.status === 'Completed' && isInstallerFile(download.file_name) ? (
                      <ActionButton 
                        className="start" 
                        onClick={() => runInstaller(download.file_path)}
                      >
                        运行安装程序
                      </ActionButton>
                    ) : null}
                    <ActionButton 
                      className="start" 
                      onClick={() => createCopyDownload(download.id)}
                    >
                      创建副本
                    </ActionButton>
                    <ActionButton 
                      className="remove" 
                      onClick={() => removeDownload(download.id)}
                    >
                      删除
                    </ActionButton>
                  </>
                ) : null}
                
                {!download.is_copy && download.copy_count > 0 ? (
                  <span style={{ 
                    fontSize: '12px', 
                    color: theme === 'dark' ? '#999' : '#666',
                    marginLeft: '10px'
                  }}>
                    副本数: {download.copy_count}
                  </span>
                ) : null}
                
                {download.is_copy ? (
                  <span style={{ 
                    fontSize: '12px', 
                    color: theme === 'dark' ? '#ffc107' : '#ff8c00',
                    marginLeft: '10px'
                  }}>
                    副本
                  </span>
                ) : null}
              </ButtonGroup>
            </DownloadItem>
          ))
        )}
      </DownloadList>

      {showAddModal && (
        <AddDownloadModal>
          <ModalContent theme={theme}>
            <ModalTitle theme={theme}>添加新下载</ModalTitle>
            
            <FormGroup>
              <Label theme={theme}>下载链接</Label>
              <Input
                theme={theme}
                type="url"
                value={newDownload.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="请输入下载链接"
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>文件名</Label>
              <Input
                theme={theme}
                type="text"
                value={newDownload.fileName}
                onChange={(e) => setNewDownload(prev => ({ ...prev, fileName: e.target.value }))}
                placeholder="请输入文件名"
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>下载路径 (可选)</Label>
              <Input
                theme={theme}
                type="text"
                value={newDownload.downloadPath}
                onChange={(e) => setNewDownload(prev => ({ ...prev, downloadPath: e.target.value }))}
                placeholder="留空使用默认下载目录"
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>
                <input
                  type="checkbox"
                  checked={newDownload.useMultiThread}
                  onChange={(e) => setNewDownload(prev => ({ ...prev, useMultiThread: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                启用多线程下载
              </Label>
            </FormGroup>
            
            {newDownload.useMultiThread && (
              <FormGroup>
                <Label theme={theme}>线程数量</Label>
                <Input
                  theme={theme}
                  type="number"
                  min="1"
                  max="16"
                  value={newDownload.threadCount}
                  onChange={(e) => setNewDownload(prev => ({ ...prev, threadCount: parseInt(e.target.value) || 8 }))}
                  placeholder="建议1-16个线程"
                />
              </FormGroup>
            )}
            
            <ModalButtonGroup>
              <ModalButton 
                className="secondary" 
                onClick={() => setShowAddModal(false)}
              >
                取消
              </ModalButton>
              <ModalButton 
                className="primary" 
                onClick={createDownload}
              >
                创建下载
              </ModalButton>
            </ModalButtonGroup>
          </ModalContent>
        </AddDownloadModal>
      )}
    </DownloadManagerContainer>
  );
};

export default DownloadManager;